+function ($) { "use strict";
    var Popup = function () {
        this.url = 'https://langflow.ru/api/v1/';
        this.apiKey = '';
        this.$loginForm = $('.popup-login');
        this.$settingsForm = $('.popup-settings');
        this.init();
        this.initFormEvents();
    };

    Popup.prototype.init = function() {
        this.apiKey = JSON.parse(localStorage.getItem('apiKey'));
        if (this.apiKey) {
            this.$settingsForm.removeClass('hidden');
            this.$loginForm.addClass('hidden');
        }
        else {
            this.$loginForm.removeClass('hidden');
            this.$settingsForm.addClass('hidden');
        }
    };

    Popup.prototype.saveApiKey = function (apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(apiKey));
        chrome.runtime.sendMessage({type: 'changeSettings'});
    };

    Popup.prototype.getApiKey = function () {
        return localStorage.getItem('apiKey');
    };

    Popup.prototype.onSignIn = function ($signInButton) {
        let self = this;
        $signInButton.prop('disabled', true);
        $.post(self.url + 'auth/login', {
            login: $('input[name="email"]').val(),
            password: $('input[name="password"]').val()
        }, function (data) {
            let apiKey = data.user.data && typeof data.user.data.api_key !== 'undefined' ? data.user.data.api_key : '';
            if (apiKey) {
                self.saveApiKey(apiKey);
                self.$loginForm.addClass('hidden');
                self.$settingsForm.removeClass('hidden');
            }
            else {
                alert('We\'re sorry, but an unhandled error occurred.');
            }
        }).fail(function () {
            alert('A user was not found with the given credentials.');
        }).always(function () {
            $signInButton.prop('disabled', false);
        });
    }

    Popup.prototype.onSignOut = function () {
        this.saveApiKey('');
        window.close();
    }

    Popup.prototype.initFormEvents = function() {
        let self = this;

        $(document).on('click', '.js-sign-in', function(e) {
            e.preventDefault();
            self.onSignIn($(this));
        });

        $(document).on('click', '.js-sign-out', function() {
            self.onSignOut();
        });
    };

    $(document).ready(function(){
        let popup = new Popup();

        if ($.langFlow === undefined)
            $.langFlow = {};

        $.langFlow.popup = popup;
    });

}(window.jQuery);