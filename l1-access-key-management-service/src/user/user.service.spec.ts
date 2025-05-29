import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from '../streaming/streaming.producer.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StreamingEvent, StreamName } from '../constants/streaming.constants';

const mockKeyStore = () => ({
  getAccessKey: jest.fn(),
  setAccessKey: jest.fn(),
  deleteAccessKey: jest.fn(),
  getAllAccessKeys: jest.fn(),
});

const mockProducer = () => ({
  publish: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let keyStore: ReturnType<typeof mockKeyStore>;
  let producer: ReturnType<typeof mockProducer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: KeyStoreService, useFactory: mockKeyStore },
        { provide: StreamingProducerService, useFactory: mockProducer },
      ],
    }).compile();

    service = module.get(UserService);
    keyStore = module.get(KeyStoreService);
    producer = module.get(StreamingProducerService);
  });

  describe('getKeyInfo', () => {
    it('should return key data if found', async () => {
      const keyData = { key: 'k1' };
      keyStore.getAccessKey.mockResolvedValue(keyData);

      await expect(service.getKeyInfo('k1')).resolves.toEqual(keyData);
    });

    it('should throw NotFoundException if key not found', async () => {
      keyStore.getAccessKey.mockResolvedValue(undefined);

      await expect(service.getKeyInfo('k1')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if getAccessKey fails', async () => {
      keyStore.getAccessKey.mockRejectedValue(new Error('DB error'));

      await expect(service.getKeyInfo('k1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('disableKey', () => {
    const keyData = {rateLimitPerMin : 0, enabled : true,expiresAt : 0}
    it('should disable the key and publish to stream', async () => {
      keyStore.getAccessKey.mockResolvedValue(keyData);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockResolvedValue(undefined);

      await expect(service.disableKey('k1')).resolves.toEqual({ message: 'Key disabled' });

      expect(keyStore.setAccessKey).toHaveBeenCalledWith('k1', { ...keyData, enabled: false });
      expect(producer.publish).toHaveBeenCalledWith(StreamName.ACCESS_KEY_EVENTS, expect.objectContaining({
        event: StreamingEvent.KEY_UPDATED,
        key: 'k1',
      }));
    });

    it('should return early if key is already disabled', async () => {
      keyStore.getAccessKey.mockResolvedValue({ key: 'k1', enabled: false });

      await expect(service.disableKey('k1')).resolves.toEqual({ message: 'Key already disabled' });
    });

    it('should throw NotFoundException if key not found', async () => {
      keyStore.getAccessKey.mockResolvedValue(undefined);

      await expect(service.disableKey('k1')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if getAccessKey fails', async () => {
      keyStore.getAccessKey.mockRejectedValue(new Error('DB error'));

      await expect(service.disableKey('k1')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if setAccessKey fails', async () => {
      const keyData = { key: 'k1', enabled: true };
      keyStore.getAccessKey.mockResolvedValue(keyData);
      keyStore.setAccessKey.mockRejectedValue(new Error('Set failed'));

      await expect(service.disableKey('k1')).rejects.toThrow(InternalServerErrorException);
    });

    it('should revert and log if publish fails and revert setAccessKey also fails', async () => {
      const keyData = { key: 'k1', enabled: true };
      keyStore.getAccessKey.mockResolvedValue(keyData);
      keyStore.setAccessKey.mockResolvedValueOnce(undefined);
      producer.publish.mockRejectedValue(new Error('Stream failed'));
      keyStore.setAccessKey.mockRejectedValueOnce(new Error('Revert failed'));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.disableKey('k1')).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('keyStore.setAccessKey(in 2nd catch) failed with error:'),
        expect.any(String),
        'k1'
      );
    });

    it('should revert and log if publish fails', async () => {
      const keyData = { key: 'k1', enabled: true };
      keyStore.getAccessKey.mockResolvedValue(keyData);
      keyStore.setAccessKey.mockResolvedValue(undefined);
      producer.publish.mockRejectedValue(new Error('Stream failed'));


      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.disableKey('k1')).rejects.toThrow(InternalServerErrorException);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('producer.publish failed with error'),
        expect.any(String),
        'k1'
      );
    });
  });
});
