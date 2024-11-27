class CacheService:
    @staticmethod
    def get_cached_result(key):
        # Retrieved the result from in-memory cache (e.g. Redis) based on the key 