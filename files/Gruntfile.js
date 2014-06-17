/*!
 * 任务说明
 * 	test、 pro 分别代表测试和正式两种模式的任务序列
 * 	default 默认执行 test
 * 	tt:mode:task:target 测试任务
 *  iwatch --r=root 初始化配置后启用 watch 任务，用于监控本地 html 的 include 和 replace
 *  注意多个参数时，第一个boolean参数不能省略 =xx，--cl --nu 会有问题，必须写成 --cl=true --nu
 *
 * 参数说明
 * :mode 模式， [local, test, pro] 自动包含于 test、pro 任务中
 * --r=root 需要部署的根目录，默认为 trunk，分支下边的省略 branch/
 * 		（！！注意：由于 grunt.option 的问题，如果 root=03，会自动转义成3，忽略数字前边的0，避免这种写法）
 * --nu 不做上传和清缓存
 * --nc 不清缓存
 * --cl 清理 upload 目录，（默认不清理，这样会累加 changes 文件）
 *
 * css js img 路径替换规则
 *  将相对路径（../../js 、 ../css、../img）替换为正式路径，本地开发则不作替换
 *  script 和 link 标签如果含 for="dev" 则直接替换为空，主要用于本地 css 提示，以及特殊的 js 调试
 */

'use strict';

module.exports = function (grunt) {
    var replace_path_js = {  // js 路径替换
            from: /(<script .*src=\")([.\/]+js)(.*\.js\".*>[\s]*)/g,
            to: '$1<%= config.path_remote_js %>$3'
        },
        replace_path_css = { // css 路径替换
            from: /(<link .*href=\")([.\/]+css)(.*\.css\".*>[\s]*)/g,
            to: '$1<%= config.path_remote_css %>$3'
        },
        replace_path_img = { // img 路径替换
            from: /(<img .*src=\"|url\(')([.\/]+img)(.*\.(?:png|jpe?g|gif)(\".*>[\s]*|'\)))/ig,
            to: '$1<%= config.path_remote_img %>$3'
        },
        defaults = {
            test: {
                dirname: 'test',
                options_uglify: {
                    mangle: false,
                    compress: false,
                    beautify: true
                },
                config_upload: {
                    auth: {
                        host: '123.58.176.61',
                        port: 21,
                        authKey: 'test'
                    },
                    src: '<%= path.upload %>',
                    dest: '/yinhe'
                },
                dest_html: '<%= path.release.html %>',
                replace_path_js: replace_path_js,
                replace_path_css: replace_path_css,
                replace_path_img: replace_path_img
            },
            pro: {
                dirname: 'pro',
                files_changes: ['img/**/*', 'js/**/*', 'css/**/*'],
                suf_compass: ' -s compressed',
                config_upload: {
                    auth: {
                        host: '61.135.251.132',
                        port: 16321,
                        authKey: 'pro'
                    },
                    src: '<%= path.upload %>',
                    dest: '/apps/mobile'
                },
                dest_html: '<%= path.release.html %>',
                replace_path_js: replace_path_js,
                replace_path_css: replace_path_css,
                replace_path_img: replace_path_img
            },
            local: {
                dest_html: '<%= path.dev.html %>'
            }
        };

    // Project configuration.
    grunt.initConfig({
        // Task configuration.
        config: {
            dirname: null, // mode对应的目录名
            options_uglify: null, // 是否压缩混淆
            path_remote_js: null, // js服务器 路径前缀
            path_remote_css: null, // css服务器 路径前缀
            replace_path_js: { from: '', to: '' },  // js 路径替换
            replace_path_css: { from: '', to: '' }, // css 路径替换
            replace_path_img: { from: '', to: '' }, // img 路径替换,
            files_changes: ['*/**'], // 需要过滤的文件集合
            suf_compass: '', // compass 编译的配置参数
            files_js: { // 需要处理的js文件
                general: null, // 普通的合并压缩
                external: null, // 外部引入的第三方js合并
                unchanged: {} // 一些不需要的压缩合并的js，直接copy
            },
            config_upload: null,
            server_index: {
                js: null,
                css: null
            },
            dest_html: null
        },

        root: {
            dev: '',
            release: 'release/<%= config.dirname %>'
        },

        path: {
            dev: {
                html: '<%= root.dev %>/html',
                js: '<%= root.dev %>/js',
                css: '<%= root.dev %>/css',
                img: '<%= root.dev %>/img',
                demo: '<%= root.dev %>/demo'
            },
            release: {
                html: '<%= root.release %>/html',
                js: '<%= root.release %>/js',
                css: '<%= root.release %>/css',
                img: '<%= root.release %>/img',
                demo: '<%= root.release %>/demo'
            },
            include: '<%= root.dev %>/_include',
            upload: 'release/upload',
            dest_html: '<%= config.dest_html %>'
        },

        includes: {
            options: {
                flatten: true,
                includePath: '<%= path.include %>/_snippet/'
            },
            general: {
                files: [{
                    expand: true,
                    cwd: '<%= path.include %>/',
                    src: ['**/*.html', '!_snippet/**'],
                    dest: '<%= path.dest_html %>/'
                }]
            }
        },
        replace: {
            general: {
                src: ['<%= path.dest_html %>/**/*.html'],
                overwrite: true,
                replacements: [{
                    from: /<(?:script|link).*for="dev".*>[\s]*/g,
                    to: ''
                }, '<%= config.replace_path_js %>',
                    '<%= config.replace_path_css %>',
                    '<%= config.replace_path_img %>'
                ]
            }
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            general: {
                options: '<%= config.options_uglify %>',
                files: '<%= config.files_js.general %>'
            },
            external: {
                options: {
                    mangle: false,
                    compress: false
                },
                files: '<%= config.files_js.external %>'
            }
        },
        copy: {
            general: {
                files: [{
                    expand: true,
                    cwd: '<%= root.dev %>/',
                    src: ['css/*.css', 'img/**', '!**/sp-*/**', '!**/base64/**'],
                    dest: '<%= root.release %>/'
                }, {
                    expand: true,
                    cwd: '<%= path.dev.demo %>/',
                    src: ['**'],
                    dest: '<%= path.release.demo %>/'
                }, '<%= config.files_js.unchanged %>']
            }
        },
        changes: {
            general: {
                options: {
                    hashmap: '<%= root.release %>/.hash'
                },
                files: [{
                    expand: true,
                    cwd: '<%= root.release %>/',
                    src: '<%= config.files_changes %>',
                    dest: '<%= path.upload %>'
                }]
            }
        },
        upload: {
            general: '<%= config.config_upload %>'
        },
        clearcache: {
            options: {
                url: 'http://61.135.251.132:81/upimage/cleanmain.php?url='
            },
            general: {
                basedir: 'http://img{n}.cache.netease.com/apps/wap/',
                js: '<%= config.server_index.js %>',
                css: '<%= config.server_index.css %>',
                img: '<%= clearcache.general.css %>',
                localRoot: '<%= path.upload %>/'
            }
        },
        clean: {
            options: {
                force: true
            },
            general: ['<%= path.upload %>/']
        },
        watch: {
            html: {
                files: ['<%= path.include %>/**/*.html'],
                tasks: ['includes', 'mapping', 'replace'],
                options: {
                    spawn: false
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-changes');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-clearcache');
    grunt.loadNpmTasks('grunt-includes');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-personal-mixin');


    /**
     * 根据 command line 初始化配置文件
     * :mode 模式， [local, test, pro]
     * --r=root 需要部署的根目录，默认为 trunk，分支下边的省略 branch/
     */
    grunt.registerTask('init', 'Initialeze config', function(mode) {
        var r = grunt.option('r'),
            root_dev = ( r && r != 'trunk' ) ? 'branch/'+r : 'trunk',
            json = grunt.file.readJSON(root_dev+'/gruntConfig.json'),
            cfg = json[mode],
            def = defaults[mode];

        // 用于清缓存的服务器编号
        if ( mode == 'pro' ) {
            var reg = /img(\d)/,
                n1 = cfg.path_remote_js.match(reg)[1],
                n2 = cfg.path_remote_css.match(reg)[1];

            def.server_index = {
                js: n1,
                css: n2
            };
        }
        grunt.config('root.dev', root_dev);
        Object.deepExtend(def, cfg);
        def.files_js = json.files_js;
        grunt.config('config', Object.deepExtend(grunt.config('config'), def));
        grunt.option('mode', mode);

//        console.log(grunt.config('config'))
        grunt.log.ok('Mode: ' + mode + '\nroot: ' + root_dev);
    });


    // Tasks
    grunt.registerTask('iwatch',['init:local', 'includes', 'mapping', 'replace', 'watch']);
    grunt.registerTask('test', ['init:test', 'empty', 'includes', 'replace', 'uglify',                 'copy', 'changes', 'date-stamp']);
    grunt.registerTask('pro',  ['init:pro',  'empty', 'includes', 'replace', 'uglify', 'compile-scss', 'copy', 'changes', 'date-stamp', 'upload']);
    grunt.registerTask('default', ['test']);


    Object.deepExtend = function(destination, source) {
        for (var property in source) {
            if ( source[property] != undefined ) {
                if (source[property] && source[property].constructor &&
                    source[property].constructor === Object) {
                    destination[property] = destination[property] || {};
                    Object.deepExtend(destination[property], source[property]);
                } else {
                    destination[property] = source[property];
                }
            }
        }
        return destination;
    };
};
