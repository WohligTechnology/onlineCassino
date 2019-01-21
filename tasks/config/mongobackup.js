module.exports = function(grunt) {
  grunt.config.set("mongobackup", {
    dump: {
      options: {
        host: "localhost",
        db: "finwiz",
        out: "./dump"
      }
    },
    restore: {
      options: {
        db: "finwiz",
        host: "localhost",
        drop: true,
        path: "./dump/finwiz"
      }
    }
  });

  grunt.loadNpmTasks("mongobackup");
};
