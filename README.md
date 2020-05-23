# 9sidor-Server
The server for the "news" site 9sidor


# How to use
Run ```npm install``` 

Create a file called ```secrets.env``` file in the folder ```config```

Add your MongoDB connection string, and your cloudinary url (for uploading images) into the ```secrets.env``` file. Both are required.  
If you wish to use a twitter bot that tweets when articles are published, you also need to specify your twitter bot credentials. 

```
MONGO_URI_9SIDOR=<your-mongo-uri>
CLOUDINARY_URL=<your-cloudinary-url>

TWITTER_API_KEY=<your-api-key>
TWITTER_API_SECRET_KEY=<your-secret-api-key>

TWITTER_ACCESS_TOKEN=<your-access-token>
TWITTER_ACCESS_TOKEN_SECRET=<your-secret-acces-token>
```

Run ```npm run dev``` for development, or run ```npm run start``` if you wish to not use nodemon.
