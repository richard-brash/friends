// Simple test to verify our testing setup works
describe('Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('hello');
    const result = await promise;
    expect(result).toBe('hello');
  });
});