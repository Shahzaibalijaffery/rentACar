process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'mongodb://127.0.0.1:27017/rentacar_test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-minimum-32-characters-long';
