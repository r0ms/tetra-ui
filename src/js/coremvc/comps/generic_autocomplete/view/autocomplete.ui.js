tetra.view.register('autocomplete', {
  scope: 'generic_autocomplete',
  use: ['autocomplete'], // required controllers

  constr: function(me, app, _) {

    'use strict';

    return {
      events: {
        user: { // events listened on the page
          'keydown': {
            '.autocomplete input': function(e, elm) {
              me.methods.reinit(elm);
              switch (e.which) {

                case 13: // enter
                  // avoid enter to allow form submit
                  e.preventDefault();
                  elm = me._container.find('.autocomplete-menu li.active');
                  var prevContainerId = me._containerId;
                  if (elm.length) {
                      me.methods.suggestions.clickOnSuggestion(elm);
                  }
                  me.methods.suggestions.hide(prevContainerId);

                  break;

                case 38: // up
                case 40: // down
                  e.preventDefault();
                  break;
              }
            }
          },

          'keyup': {
            '.autocomplete input': function(e, elm) {
              me.methods.reinit(elm);
              switch (e.which) {

                case 37: // left
                case 39: // right
                  if (!me._container.hasClass('active')) {
                    me.methods.suggestions.doQuery(elm, false);
                  }
                  break;

                case 13: // enter
                  break;

                case 27: // esc
                  me.methods.suggestions.hide(me._containerId);
                  break;

                case 38: // up
                  me.methods.suggestions.select('previous');
                  break;

                case 40: // down
                  me.methods.suggestions.select('next');
                  break;

                default:
                  if (elm.val().length >= parseInt(me._container.attr('data-min-length'), 10)) {
                    me.methods.suggestions.doQuery(elm, true);
                  }

                  if (elm.val().length === 0) {
                    me.methods.suggestions.hide(me._containerId);
                  }

                  break;
              }
            }
          },

          'focus': {
            '.autocomplete input': function(e, elm) {
              me._containerId = null;
              me.methods.reinit(elm);
              if (elm.val().length >= parseInt(me._container.attr('data-min-length'), 10)) {
                me.methods.suggestions.doQuery(elm, true);
              }
            }
          },

          'blur': {
            '.autocomplete input':function (e, elm) {
                var prevContainerId = me._containerId;
                me.methods.reinit(elm);
                window.setTimeout(function () {
                    me.methods.suggestions.hide(prevContainerId);
                }, 200);
            }
          },

          'click': {
            '.autocomplete .autocomplete-menu li': function(e, elm) {
              var prevContainerId = me._containerId;
              me.methods.suggestions.clickOnSuggestion(elm);
              me.methods.suggestions.hide(prevContainerId);
            }
          }
        },

        controller: {

          'display suggestions': function(suggestionsPack) {
            // Check if the response content one or many suggestions
            var havingSuggestion = false;
            for (var suggestion in suggestionsPack.data.completion) {
                havingSuggestion = true;
                break;
            }
            if (!havingSuggestion) {
                // No suggestion to show
                return;
            }

            var suggestions = {};
            suggestions.data = suggestionsPack.data.completion;
            suggestions.query = me._input.val();
            app.exec(me._templateRef, suggestions, function(html) {
              _(me._menu).html(html);
            });

            me._menu.find('li:first-child').addClass('active');
            me._container.addClass('active');
          },

          'display value': function(data) {
            me._input.val(data.value);
            me.methods.suggestions.hide(me._containerId);
          }

        }
      },

      methods: {
        init: function() {
          me._param = '%param%';
          me._containerId = null;
        },
        reinit: function(elm) {
          if (!me._containerId) {
            me._containerId = _(elm.parents('.autocomplete'))[0].id;
            me._container = _('#' + me._containerId);
            me._paramName = me._container.attr('data-param') || 'param';
            me._input = me._container.find('input');
            me._menu = me._container.find('#' + me._container.attr('data-suggest-container-id'));
            me._templateRef = me._container.attr('data-suggest-template-ref');

            if (_('#tmpl_' + me._templateRef).length === 0) {
              me._templateRef = me._templateRef.substring(0, me._templateRef.indexOf('_')) + '_1';
            }
          }
        },
        suggestions: {
          select: function(direction) {
            var items = me._container.find('.autocomplete-menu li');
            var index = items.filter('.active').removeClass('active').index();
            index += (direction === 'next') ? 1 : -1;
            if (index >= items.length) {
              index = 0;
            }
            items.eq(index).addClass('active');
          },
          hide: function(containerId) {
              _('#' + containerId).removeClass('active');
          },
          replaceParam: function(url, param) {
            return url.replace(me._param, param);
          },
          clickOnSuggestion: function(elm) {
            var value = _.trim(_(elm.find('.value')).text());
            if (typeof value !== 'undefined' && value.length > 0) me._input.val(value);
            app.notify('autocompleteGeneric : click on suggestion', elm[0]);
            me._containerId = null;
          },
          doQuery: function(elm, delay) {
            var param = elm.val();
            var url = me.methods.suggestions.replaceParam(me._container.attr('data-url'), param);
            var data = {
              url: url,
              id: me._containerId
            };
            if (delay) {
              data.typingDelay = me._container.attr('data-typing-delay') || undefined;
            }
            data[me._paramName] = param;
            // PARTICULAR CASES
            var form;
            if (elm.hasClass('schoolDepartment')) {
              form = _(elm.parents('.core-form'))[0];
              _(form).find('#schoolId').val('');
              data.itemName = _(form).find('.autocompleteSchool').val();
              if (data.itemName.blank()) {
                return;
              }
              data.town = _(form).find('input.town').val();
            } else if (elm.hasClass('autocompleteSchool')) {
              form = _(elm.parents('.core-form'))[0];
              _(form).find('#schoolId').val('');
              _(form).find('input.town').val('');
            }
            app.notify('do query', data);
          }
        }
      }
    };
  }
});
