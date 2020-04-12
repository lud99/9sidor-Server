class SubjectDataFormatter
{
    static format(subjects, format = this.formats.default)
    {
        // Initially format it differently if the format is a list
        let data = (format != this.formats.list ? [] : { subjects: [] });

        // Iterate through each article
        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];

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
                        _id: subject._id,
                        name: subject.name,
                        nameLowercase: subject.nameLowercase,
                        nameNormalized: subject.nameNormalized,
                        backgroundColor: subject.backgroundColor,
                        url: subject.url
                    });

                    break;
                }


                default: data.push(article);
            }
        }

        return data;
    }
}

SubjectDataFormatter.formats = {
    internal: 0,
    default: 1,
    preview: 2,
    list: 3,
};

module.exports = SubjectDataFormatter;