// CleanRequestService.js
// Clean architecture service for requests
// Implements business logic for V2 requests API

class CleanRequestService {
  constructor(requestRepository) {
    this.requestRepository = requestRepository;
  }

  async getAll({ includeStatusHistory = false } = {}) {
    return await this.requestRepository.getAll({ includeStatusHistory });
  }

  async getById(id, { includeStatusHistory = false } = {}) {
    return await this.requestRepository.getById(id, { includeStatusHistory });
  }

  async create(requestData) {
    return await this.requestRepository.create(requestData);
  }

  async update(id, updateData) {
    return await this.requestRepository.update(id, updateData);
  }

  async delete(id) {
    return await this.requestRepository.delete(id);
  }

  async addStatusHistory(requestId, historyData) {
    return await this.requestRepository.addStatusHistory(requestId, historyData);
  }

  async getStatusHistory(requestId) {
    return await this.requestRepository.getStatusHistory(requestId);
  }

  async getDeliveryAttempts(requestId) {
    // Returns only delivery-related status history (delivered and delivery_attempt_failed)
    return await this.requestRepository.getDeliveryAttempts(requestId);
  }
}

export default CleanRequestService;
