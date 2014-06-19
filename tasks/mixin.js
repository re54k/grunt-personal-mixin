/*
 * grunt-personal-mixin
 * https://github.com/catnofish/grunt-personal-mixin
 *
 * Copyright (c) 2014 Herk Lee (http://www.herk.me/)
 * Licensed under the MIT license.
 * Herk Lee
 */

'use strict';

module.exports = function(grunt) {
    grunt.registerTask('mapping', 'Compiled js maps to sources file', function() {
        var scripts = grunt.config('config.files_js'),
            map = {},
            filters = [],
            v, short, from, to, i;

        // 过滤js文件
        for ( var t in scripts ) {
            v = scripts[t];
            for ( var dest in v ) {
                short = dest.split('/').pop();
                map[short] = v[dest];
            }
        }

        for ( dest in map ) {
            v = map[dest];
            from = new RegExp('<script .*src=\"(.*\/js)/.*' + dest + '\"><\/script>', 'g');
            to = [];
            for ( i = 0 ; i < v.length; i++ ) {
                to.push('<script src="' + v[i].replace(grunt.config('path.dev.js'), '$1') + '"></script>');
            }
            filters.push({
                from: from,
                to: to.join('\n\t')
            });
        }

        var rms = grunt.config('replace.general.replacements');
        grunt.config('replace.general.replacements', rms.concat(filters));
    });

    grunt.registerTask('compile-scss', 'Compile scss files', function() {
        var exec = require('child_process').exec,
            cmd = 'compass compile ' + grunt.config('root.dev') + '/css --force' + grunt.config('config').suf_compass,
            done = this.async();

        exec(cmd, function(err) {
            err && grunt.fatal(err);
            grunt.log.ok('All scss files had been compiled.');
            done();
        });
    });

    grunt.registerTask('tt', 'Test task', function(mode, task, target) {
        var t = task + (target ? ':'+target : '');
        grunt.task.run(['init:' + mode, t]);
    });

    grunt.registerTask('empty', 'If clean the upload directory', function() {
        if ( grunt.option('cl') ) {
            grunt.task.run('clean');
        }
    });

    grunt.registerTask('date-stamp', 'Add date stamp to updated js files', function() {
        var stamp = '/*! Updated at ' + grunt.template.today("mmmm dS, yyyy, H:MM:ss") + ' */\r\n',
            uploadpath = grunt.config('path.upload'),
            jspath = uploadpath+'/js',
            csspath = uploadpath+'/css';

        if ( grunt.file.exists(jspath) ) {
            grunt.file.recurse(jspath, function callback(abspath) {
                grunt.file.write(abspath, stamp + grunt.file.read(abspath));
            });
        }

        if ( grunt.file.exists(csspath) ) {
            grunt.file.recurse(csspath, function callback(abspath) {
                grunt.file.write(abspath, stamp + grunt.file.read(abspath));
            });
        }
    });

    grunt.registerTask('upload', 'Upload files', function() {
        if ( grunt.option('nu') ) {
            grunt.log.ok('Upload canceled.');
            return;
        }
        var data = grunt.config('upload').general,
            auth = data.auth,
            authKey = auth.authKey || auth.host,
            authVals = grunt.file.readJSON('.ftppass')[authKey],
            exec = require('child_process').exec,
            cmd = 'lftp -c "open -e \'mirror -R -p ' + data.src + ' ' + data.dest + '\'' + ' -p ' + auth.port + ' -u ' + authVals.username + ',' + authVals.password + ' ' + auth.host + '"';

        var done = this.async();
        exec(cmd, function(err) {
            err && grunt.fatal(err);
            grunt.log.ok('Uploaded all files.');
            done();
        });

        // 清缓存
        if ( grunt.option('mode') == 'pro' && !grunt.option('nc') ) {
            grunt.task.run('clearcache');
        }
    });

    grunt.registerTask('submit', 'Submit to SVN', function() {
        var readline = require('readline'),
            rl = readline.createInterface(process.stdin, process.stdout),
            exec = require('child_process').exec,
            cmd = 'svn ci ' + grunt.config('root') + ' -m ',
            done = this.async(),
            def = '[NULL]';

        rl.question('Submit to SVN？ `y` or empty to continue: ', function(yes) {
            if ( yes === '' || yes == 'y' || yes == 'Y' ) {
                rl.question('Log: \r\n' + def, function(msg) {
                    msg = msg.trim() || def;
                    cmd += msg;
                    rl.close();
                    exec(cmd, function(err) {
                        err && grunt.fatal(err);
                        grunt.log.ok('Submit all files.');
                        done();
                    });
                });
            } else {
                rl.close();
                done();
            }
        });
    });
};
