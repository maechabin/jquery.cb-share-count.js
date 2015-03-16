module.exports = function (grunt) {

  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({

    uglify: {
      dist: {
        files: {
          'jquery.cbsharecount.min.js': 'jquery.cbsharecount.js'
        }
      }
    },

    watch: {
      js: {
        files: 'jquery.cbsharecount.js',
        tasks: ['uglify']
      }
    },

    jshint: {
      all: ['jquery.cbsharecount.js']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('hint', ['jshint']);

};