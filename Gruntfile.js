module.exports = function (grunt) {
  'use strict';

  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    connect: {
      server: {
        options: {
          port: 8090,
          base: '.'
        }
      }
    },

    open: {
      dev: {
        path: 'http://localhost:8090'
      }
    },

    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: 'sass/',
          src: ['*.scss'],
          dest: 'css/',
          ext: '.css'
        }]
      }
    },

    watch: {
      all: {
        files: ['*.html', 'css/**/*.css', 'js/**/*.js'],
        options: {
          livereload: true
        }
      },

      sass: {
        files: 'sass/**/*.scss',
        tasks: ['sass:dist'],
        options: {
          livereload: true
        }
      }
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'index.html'
        }
      }
    },

    cssmin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'css/',
          src: '*.css',
          dest: 'dist/css/'
        }]
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/js/main.js': ['js/main.js'],
          'dist/js/router.js': ['js/router.js'],
          'dist/js/scope.js': ['js/scope.js'],
          'dist/js/chop.min.js': ['js/chop.min.js'],
          'dist/js/highlight.min.js': ['js/highlight.min.js'],
          'dist/js/marked.js': ['js/marked.js']
        }
      }
    },

    copy: {
      dist: {
        files: [
          {expand: true, src: ['./js/chop.min.js.map'], dest: 'dist/'},
          {expand: true, cwd: 'js/src-min-noconflict/', src: ['**'], dest: 'dist/js/src-min-noconflict/'},
          {expand: true, src: ['./editor-template.html'], dest: 'dist/'},
          {expand: true, src: ['./nav-template.html'], dest: 'dist/'},
          {expand: true, src: ['./markdown-template.html'], dest: 'dist/'},
          {expand: true, src: ['./preview-template.html'], dest: 'dist/'},
          {expand: true, src: ['./overlay-template.html'], dest: 'dist/'},
          {expand: true, src: ['./remove-template.html'], dest: 'dist/'},
          {expand: true, src: ['./img/markdown.png'], dest: 'dist/'},
          {expand: true, src: ['./img/blueprint.png'], dest: 'dist/'},
          {expand: true, src: ['./php/sync.php'], dest: 'dist/'},
          {expand: true, src: ['./css/chopjs-layout.css'], dest: 'dist/'},
          {expand: true, src: ['./css/chopjs-ui-style.css'], dest: 'dist/'},
          {expand: true, src: ['./.htaccess'], dest: 'dist/'},
          {expand: true, src: ['./cache.appcache'], dest: 'dist/'}
        ]
      }
    },

    'ftp-deploy': {
      dist: {
        auth: {
          host: 'feifeihang.info',
          port: 21,
          authKey: 'key'
        },
        src: 'dist/',
        dest: '/public_html/note/'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ftp-deploy');

  grunt.registerTask('serve', ['connect', 'open', 'watch']);
  grunt.registerTask('build', ['htmlmin', 'sass', 'cssmin', 'uglify', 'copy']);
  grunt.registerTask('deploy', ['ftp-deploy']);

};
