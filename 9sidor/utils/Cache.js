class Cache
{
    constructor()
    {
        this.cache = new Map;
    }

    clear()
    {
        this.cache = new Map;
    }

    exists(url) 
    {
        return this.cache.has(url);
    }

    get(url) 
    {
        return this.cache.get(url);
    }

    update(url, content) 
    {
        this.cache.set(url, content)
    }

    delete()
    {

    }

    static init()
    {
        if (!global.cache)
            global.cache = new Cache();
        
        return global.cache;
    }
}

module.exports = Cache;