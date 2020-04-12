class ArticleDataFormatter
{
    static format(articles, format = this.formats.default)
    {
        // Initially format it differently if the format is a list
        let data = (format != this.formats.list ? [] : { subjects: [] });

        // Iterate through each article
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];

            const subject = article.subject;
            const image = article.image;

            // Preview format
            switch (format) {
                // Internal formatting
                case this.formats.internal: {
                    data.push(article);

                    break;
                };

                // Default formatting
                case this.formats.default: {
                    data.push({
                        _id: article._id,
                        subject: {
                            name: subject.name,
                            nameLowercase: subject.nameLowercase,
                            nameNormalized: subject.nameNormalized,
                            backgroundColor: subject.backgroundColor,
                            url: subject.url
                        },
                        image: (image ? { 
                            url: image.url,
                            text: image.text,
                            createdAt: image.createdAt
                        } : undefined ),
                        title: article.title,
                        titleLowercase: article.titleLowercase,
                        titleNormalized: article.titleNormalized,
                        mainText: article.mainText,
                        previewText: article.previewText,
                        displayDate: article.displayDate,
                        createdAt: article.createdAt,
                        url: article.url
                    });

                    break;
                }

                // Preview formatting
                case this.formats.preview: {
                    data.push({
                        _id: article._id,
                        subject: {
                            name: subject.name,
                            nameLowercase: subject.nameLowercase,
                            nameNormalized: subject.nameNormalized,
                            backgroundColor: subject.backgroundColor,
                            url: subject.url
                        },
                        image: (image ? { url: image.url } : undefined ),
                        title: article.title,
                        previewText: article.previewText,
                        displayDate: article.displayDate,
                        createdAt: article.createdAt,
                        url: article.url
                    });

                    break;
                }

                // List formatting
                case this.formats.list: {
                    // Find the subject object added to the data array
                    const subjectEntry = data.subjects.filter(e => e.name === subject.name)[0];

                    // If the subject hasn't been added to the array yet
                    if (!subjectEntry) {
                        // Add the subject
                        data.subjects.push({
                            name: subject.name,
                            backgroundColor: subject.backgroundColor,
                            url: subject.url,
                            articles: [{ // Add the article from the current iteration
                                title: article.title,
                                url: article.url
                            }]
                        });
                    } else { 
                        // Add the article to the subject object
                        subjectEntry.articles.push({
                            title: article.title,
                            url: article.url
                        });
                    }

                    break;
                }

                default: data.push(article);
            }
        }

        return data;
    }
}

ArticleDataFormatter.formats = {
    internal: 0,
    default: 1,
    preview: 2,
    list: 3,
};

module.exports = ArticleDataFormatter;