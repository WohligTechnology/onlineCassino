module.exports = function (grunt) {

    grunt.config.set('mongobackup', {
        import: {
            options: {
                db: 'poker',
                host: 'localhost',
                drop: true,
                path: './import'
            }
        }
    });

    grunt.loadNpmTasks('mongobackup');
};