# 9sidor-Server
The server for the "news" site 9sidor.ml


# How to use
Run ```npm install``` 

Create a file called ```secrets.env``` file in the folder ```config```

Add your MongoDB connection string, and your cloudinary url (for uploading images) into the secrets.env file. Both are required  

```
MONGO_URI=<your-mongo-uri>
CLOUDINARY_URL=<your-cloudinary-url>
```

Run ```npm run dev``` for development, or run ```npm run start``` if you wish to not use nodemon.
