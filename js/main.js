/* global $ch, ace, marked */
$ch.require(['./scope', 'crypto', 'utils', 'ui', 'event', 'layout', 'store', './router'], function () {
  'use strict';

  var SYNC = 'http://feifeihang.info/note/php/sync.php';
  var SOTRE_KEY = 'speed-note';

  $ch.event.listen('nav', function () {
    var navTemplate = $ch.readFile('nav-template.html');
    $ch.scope('appScope').nav.html(navTemplate);
    setNavScope();
  })
  .listen('editor', function () {
    // Jump to `home` if something is wrong.
    try {
      var editorTemplate = $ch.readFile('editor-template.html');
      $ch.scope('appScope').editorContainer.html(editorTemplate);
      setEditorScope();
    } catch (err) {
      $ch.router.navigate('home');
    }
  })
  .listen('bind editor', function ($scope) {
    var editorScope = $ch.scope('editorScope');

    // Set Ace editor to EditorScope.
    editorScope.ace = $scope.ace;
  })
  .listen('load', function (id) {
    // Save current work first.
    $ch.scope('editorScope')._eventHandler.emit('save');

    $ch.event.emit('editor');
    // Jump to `home` if something is wrong.
    try {
      // First, highlight active note list.
      var ul = $ch.scope('navScope').notesUl;
      var lis = $ch.findAll("li", ul.el);
      $ch.each(lis, function (li) {
        li.removeClass('active');
      });

      $ch.find('[data-id=' + id + ']').addClass('active');

      // Then, load editor.
      $ch.source('id', id);
      var note = $ch.store.local(SOTRE_KEY)[id];
      $ch.source('markdown', decodeURIComponent(note.content));
      var preview = $ch.readFile('preview-template.html');
      $ch.scope('editorScope').container.html(preview);
      setPreviewScope();
    } catch (err) {
      $ch.router.navigate('home');
    }
  })
  .listen('new', function() {
    // Save current work first.
    $ch.scope('editorScope')._eventHandler.emit('save');

    // First, remove all active note highlight.
    var ul = $ch.scope('navScope').notesUl;
    var lis = $ch.findAll("li", ul.el);
    $ch.each(lis, function (li) {
      li.removeClass('active');
    });


    // Clear markdown data source.
    $ch.source('markdown', undefined);
    $ch.source('id', undefined);
    // Set editor scope
    var editorTemplate = $ch.readFile('editor-template.html');
    // Get editor container from appScope.
    $ch.scope('appScope').editorContainer.html(editorTemplate);
    setEditorScope(true);
  });

  // Setting router rules.
  $ch.router.add({
    'home': function () {
      $ch.scope('appScope', function () {
        $ch.event.emit('nav');
        $ch.event.emit('editor');
      });
    },
    'note/:id': function (q) {
      $ch.event.emit('load', q.id);
    },
    'remove': function () {
      var id = $ch.source('id');
      if (id === undefined || id === null) {
        return;
      }
      var notes = $ch.store.local(SOTRE_KEY);
      delete notes[id];
      $ch.store.local(SOTRE_KEY, notes);

      $ch.event.emit('nav');
      $ch.event.emit('editor');
    },
    'export': function () {
      var json = $ch.store.local(SOTRE_KEY) || {};
      json = JSON.stringify(json);
      window.location = 'data:application/octet-stream,' + encodeURIComponent(json);
    },
    'push': function () {
      var passcode = window.prompt('Please set a passcode.');
      if (passcode === null || passcode === undefined) {
        return;
      }

      var content = $ch.store.local(SOTRE_KEY) || undefined;
      if (content) {
        content = content[$ch.source('id')];
      }
      content = JSON.stringify(content);
      content = encodeURIComponent(content);

      // Generate an ID for this collection of notes.
      var notes = $ch.crypto.md5(content + passcode + Date.now() + $ch.utils.random(1000, 99999));

      var callback = function (res) {
        if (res.status === 200) {
          alert('Your public note ID is: ' + notes);
        } else {
          alert('Oops, something wrong. Please try later.');
        }

        $ch.router.navigate('#');
      };

      $ch.http(SYNC, {
        method: 'POST',
        data: {
          notes: notes,
          content: encodeURIComponent(content),
          passcode: passcode
        },
        done: callback
      });
    },
    "sync/:notes": function (q) {
      var notes = q.notes;
      var passcode = window.prompt('Passcode: ');
      if (passcode === null || passcode === undefined) {
        return;
      }

      var url = SYNC + '?notes=' + notes + '&passcode=' + passcode;

      var callback = function (res) {
        if (res.status === 200) {
          var content = res.responseText;
          content = decodeURIComponent(content);
          content = JSON.parse(content);

          var notes = $ch.store.local(SOTRE_KEY);
          content.id = Date.now() + $ch.utils.random(1000, 9999);
          content.cloud = true;
          notes[content.id] = content;

          $ch.store.local(SOTRE_KEY, notes);
          $ch.router.navigate('home');
        }
      };

      $ch.http(url, {
        done: callback
      });

    },
    "pull": function () {
      var notes = window.prompt('Public note ID: ');
      if (notes !== undefined && notes !== null) {
        $ch.router.navigate('sync/' + notes);
      } else {
        $ch.router.navigate('#');
      }
    }

  });

  $ch.router.navigate('home');

  function setNavScope() {
    $ch.scope('navScope', function ($scope, $event) {
      $ch.source('notes', $ch.store.local(SOTRE_KEY) || {});
      $scope.noteEntities = [];
      $ch.each($ch.source('notes'), function (id, note) {
        $scope.noteEntities.push({
          id: note.id,
          title: note.title,
          cloud: note.cloud === true
                  ? '<i class="fa fa-cloud"></i> '
                  : ''
        });
      });

      $scope.notesUl.inline($scope.noteEntities);

      $event.listen('new', function () {
        $ch.event.emit('new');
      });

    });
  }

  function setEditorScope(startEdit) {
    $ch.scope('editorScope', function ($scope, $event) {
      $event.listen('save', function () {
        if ($scope.ace === undefined ||
            $scope.ace.getValue().trim() === '') {
          return;
        }
        var id = $ch.source('id') || Date.now();
        var content = $scope.ace.getValue();
        var title = content.trim().split('\n')[0];
        content = encodeURIComponent(content);

        var notes = $ch.source('notes') || {};
        notes[id] = {
          id: id,
          title: title,
          content: content
        };
        $ch.store.local(SOTRE_KEY, notes);
        $ch.source('notes', notes);
        $ch.source('id', id);

        $ch.event.emit('nav');

        // First, highlight active note list.
        var ul = $ch.scope('navScope').notesUl;
        var lis = $ch.findAll("li", ul.el);
        $ch.each(lis, function (li) {
          li.removeClass('active');
        });

        $ch.find('[data-id=' + id + ']').addClass('active');

      })
      .listen('edit', function () {
        var markdown = $ch.readFile('markdown-template.html');
        $scope.container.html(markdown);
        setMarkdownScope();

        $scope.previewBtn.removeClass('active');
        $scope.editBtn.addClass('active');
      })
      .listen('preview', function () {
        if ($scope.ace) {
          var content = $scope.ace.getValue();
          $ch.source('markdown', content);
        }

        var preview = $ch.readFile('preview-template.html');
        $scope.container.html(preview);
        setPreviewScope();

        $scope.editBtn.removeClass('active');
        $scope.previewBtn.addClass('active');
      })
      .listen('download', function () {
        var prefix = 'data:text/html,';
        var markdown = decodeURIComponent($ch.source('markdown') || '');

        window.location = prefix + marked(markdown, {
          gfm: true,
          tables: true,
          breaks: true
        });
      });

      if (startEdit) {
        $event.emit('edit');
      } else {
        $event.emit('preview');
      }

    });
  }

  function setMarkdownScope() {
    $ch.scope('markdownScope', function ($scope) {
      $ch.source('change', undefined);
      var markdown = $ch.source('markdown');
      if (markdown) {
        $scope.editor.content(markdown);
      }

      $scope.ace = ace.edit($scope.editor.get('id'));
      $scope.ace.setTheme("ace/theme/tomorrow_night_eighties");
      $scope.ace.getSession().setMode("ace/mode/markdown");
      $scope.ace.setFontSize(14);

      $ch.event.emit('bind editor', $scope);

    });
  }

  function setPreviewScope() {
    $ch.scope('previewScope', function ($scope) {
      var markdown = $ch.source('markdown');
      if (markdown) {
        $scope.preview.html(marked(markdown, {
          gfm: true,
          tables: true,
          breaks: true
        }));
      }
    });
  }

});