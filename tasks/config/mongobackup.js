module.exports = function (grunt) {

    grunt.config.set('mongobackup', {
        dump: {
            options: {
                host: 'localhost',
                db: 'poker',
                out: './dump'
            }
        },
        restore: {
            options: {
                db: 'poker2',
                host: 'localhost',
                drop: true,
                path: './dump/poker'
            }
        },
    });

    grunt.loadNpmTasks('mongobackup');
};