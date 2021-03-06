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
                // List formatting
                case this.formats.list: {
                    // Find the subject object added to the data array
                    const subjectEntry = data.subjects.find(e => e.name === subject.name);
                    
                    // If the subject hasn't been added to the array yet
                    if (!subjectEntry) {
                        // Add the subject
                        data.subjects.push({
                            _id: subject._id,
                            name: subject.name,
                            backgroundColor: subject.backgroundColor,
                            url: subject.url,
                            index: subject.index,
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