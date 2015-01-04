'use strict';

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 9000,
                    base: '',
                    livereload: 35729
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:9000/index.php'
            }
        },
        php: {
            dist: {
                options: {
                    port: 9000
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */',
                compress: {
                    drop_console: false
                }
            },
            production: {
                files: {
                    'includes/js/vendor.min.js': [
                        'includes/js/src/vendor/backburner.js-0.2.0.js',
                        'includes/js/src/vendor/jquery.min.js'
                    ],
                    'includes/js/index.min.js': [
                        'includes/js/src/deprecated_api.js',
                        'includes/js/src/pineapple.js'
                        ]
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'includes/css/index.min.css': [
                        'includes/css/src/**'
                    ]
                }
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            },
            all: ['Gruntfile.js', 'includes/js/src/*.js']
        },
        watch: {
            scripts: {
                files: ['includes/js/src/*.js'],
                //tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            styles: {
                files: ['includes/css/src/**'],
                //tasks: ['less:www'],
                options: {
                    livereload: true
                }
            }
        },
        less: {
            www: {
                options: {
                    paths: ['includes/css/src/'],
                    cleancss: false
                },
                files: {
                    'www/css/index.css' : 'includes/css/src/*.less'
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-php');

    // Default task(s).
    //grunt.registerTask('default', ['less:www']);


    // Server
    grunt.registerTask('default', 'Run server', [
        'php:dist',
        'open:server',
        'watch'
    ]);
};