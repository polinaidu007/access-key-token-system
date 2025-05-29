// test/admin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from '../streaming/streaming.producer.service';
import { AdminService } from './admin.service';

const mockKeyStore = () => ({
  getAccessKey: jest.fn(),
  setAccessKey: jest.fn(),
  deleteAccessKey: jest.fn(),
  getAllAccessKeys: jest.fn(),
});

const mockProducer = () => ({
  publish: jest.fn(),
});

describe('AdminService', () => {
  let service: AdminService;
  let keyStore: ReturnType<typeof mockKeyStore>;
  let producer: ReturnType<typeof mockProducer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: KeyStoreService, useFactory: mockKeyStore },
        { provide: StreamingProducerService, useFactory: mockProducer },
      ],
    }).compile();

    service = module.get(AdminService);
    keyStore = module.get(KeyStoreService);
    producer = module.get(StreamingProducerService);
  });

  describe('createKey', () => {
    const payload = { key: 'existingKey', rateLimitPerMin : 0, expiresAt : 0 }
    it('should throw ConflictException if key exists', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'existingKey' });
      await expect(service.createKey(payload)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerError if getAccessKey fails', async () => {
      keyStore.getAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.createKey(payload)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerError if setAccessKey fails', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      keyStore.setAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.createKey(payload)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerError and attempt revert if publish fails', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockRejectedValue(new Error('Kafka error'));
      keyStore.deleteAccessKey.mockResolvedValue(undefined);

      await expect(service.createKey(payload)).rejects.toThrow(InternalServerErrorException);
      expect(keyStore.deleteAccessKey).toHaveBeenCalled();
    });

    it('should return success message on success', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockResolvedValue(undefined);

      const result = await service.createKey(payload);
      expect(result).toEqual({ message: 'Key created' });
    });

    it('should log error if revert deleteAccessKey fails during createKey', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockRejectedValue(new Error('Stream failed'));

      // Simulate failure in revert
      keyStore.deleteAccessKey.mockRejectedValue(new Error('Revert delete failed'));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.createKey(payload)).rejects.toThrow(InternalServerErrorException);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to revert create action'),
        expect.any(String),
        payload
      );
    });

  });

  describe('getKey', () => {
    it('should return key if found', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1' });
      expect(await service.getKey('k1')).toEqual({ key: 'k1' });
    });
  });

  describe('listKeys', () => {
    it('should return empty array if none found', async () => {
      keyStore.getAllAccessKeys.mockResolvedValue(null);
      expect(await service.listKeys()).toEqual([]);
    });
  });

  describe('updateKey', () => {
    const payload = { expiresAt : 0, rateLimitPerMin : 0 }
    it('should throw NotFoundException if key not found', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      await expect(service.updateKey('missingKey', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if getAccessKey fails', async () => {
      keyStore.getAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.updateKey('someKey', {})).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if setAccessKey fails', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1', enabled: true });
      keyStore.setAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.updateKey('someKey', {})).rejects.toThrow(InternalServerErrorException);
    });

    it('should revert update if publish fails', async () => {
      const existing = { key: 'k1', enabled: true };
      keyStore.getAccessKey.mockResolvedValue(existing);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockRejectedValue(new Error('Stream error'));

      await expect(service.updateKey('k1', payload)).rejects.toThrow(InternalServerErrorException);
      expect(keyStore.setAccessKey).toHaveBeenCalledWith('k1', existing); // revert
    });

    it('should return success message on success', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1', enabled: true });
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockResolvedValue(undefined);

      expect(await service.updateKey('k1', payload)).toEqual({ message: 'Key updated' });
    });

    it('should log error if revert setAccessKey fails during updateKey', async () => {
      const key = 'k1';
      const existing = { key, enabled: true };
      const updateData = { ...existing, ...payload };

      keyStore.getAccessKey.mockResolvedValue(existing);
      keyStore.setAccessKey.mockResolvedValueOnce(undefined); // initial update
      producer.publish.mockRejectedValue(new Error('Stream failed')); // publish fails
      keyStore.setAccessKey.mockRejectedValueOnce(new Error('Revert setAccessKey failed')); // revert fails

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      await expect(service.updateKey(key, payload)).rejects.toThrow(InternalServerErrorException);

      // Look for the exact log message from the second catch block
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('keyStore.setAccessKey(inside 2nd catch) failed with error:'),
        expect.any(String),
        key,
        payload
      );
    });


  });

  describe('deleteKey', () => {
    it('should throw NotFoundException if key not found', async () => {
      keyStore.getAccessKey.mockResolvedValue(null);
      await expect(service.deleteKey('missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if getAccessKey fails', async () => {
      keyStore.getAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.deleteKey('someKey')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if deleteAccessKey fails', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1' });
      keyStore.deleteAccessKey.mockRejectedValue(new Error('DB error'));
      await expect(service.deleteKey('someKey')).rejects.toThrow(InternalServerErrorException);
    });

    it('should revert delete if publish fails', async () => {
      const existing = { key: 'k1' };

      keyStore.getAccessKey = jest.fn().mockResolvedValue(existing);
      keyStore.deleteAccessKey = jest.fn().mockResolvedValue(undefined);
      keyStore.setAccessKey = jest.fn().mockResolvedValue(undefined); 

      producer.publish = jest.fn().mockRejectedValue(new Error('Stream error'));

      await expect(service.deleteKey('k1')).rejects.toThrow(InternalServerErrorException);

      expect(keyStore.setAccessKey).toHaveBeenCalledWith('k1', existing);
    });


    it('should return success message on success', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1' });
      keyStore.deleteAccessKey.mockResolvedValue(undefined);
      producer.publish.mockResolvedValue(undefined);

      expect(await service.deleteKey('k1')).toEqual({ message: 'Key deleted' });
    });

    it('should log error if revert setAccessKey fails during deleteKey', async () => {
      const key = 'k1';
      const existing = { key };

      keyStore.getAccessKey.mockResolvedValue(existing);
      keyStore.deleteAccessKey.mockResolvedValue(undefined);
      producer.publish.mockRejectedValue(new Error('Stream failed'));

      // Simulate failure in revert
      keyStore.setAccessKey.mockRejectedValue(new Error('Revert setAccessKey failed'));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.deleteKey(key)).rejects.toThrow(InternalServerErrorException);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('keyStore.setAccessKey failed with error:'),
        expect.any(String),
        key
      );
    });

  });
});
