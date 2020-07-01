+function ($) { "use strict";
    var Options = function () {
        this.settingsArray = [];
        this.selectInterval = document.getElementById("selectInterval").getElementsByTagName("input")[0];
        this.selectDuration = document.getElementById("selectDuration").getElementsByTagName("input")[0];
        this.$selectInterval = $('#selectInterval input');
        this.$selectDuration = $('#selectDuration input');
        this.$rangeWrapper = $('.rangeWrapper');
        this.$showNativeCards = $('#showNativeCards');
        this.$showNotificationCards = $('#showNotificationCards');
        this.$showTestCard = $('#showTestCard');
        this.$showTestNotofication = $('#showTestNotification');
        this.$collections = $('#collections');
        this.$collection = $('.js-collection');
        this.collections = [0];

        this.init();
        this.initFormEvents();
    };

    Options.prototype.init = function () {
        var self = this;

        this.apiKey = JSON.parse(localStorage.getItem('apiKey'));
        this.settingsArray = JSON.parse(localStorage.getItem('settingsArray'));

        this.$showNotificationCards.prop('checked', this.settingsArray.showNotificationCardsChecked);
        this.$showNativeCards.prop('checked', this.settingsArray.showNativeCardsChecked);

        this.selectInterval.value = this.settingsArray.selectInterval;
        this.selectDuration.value = this.settingsArray.selectDelay;

        let intervalValue = this.selectInterval.value;
        let durationValue = this.selectDuration.value;
        this.$rangeWrapper.each(function () {
            $(this).children("input[type=range]").on('change mousemove', function () {
                if (!$(this).parent().is('#displays')) {
                    $(this).parent().children('.countWrapper').children('.count').html($(this).val());
                } else {
                    let $countWrapperSpan = $(this).parent().find('.countWrapper');
                    let $countSpan = $countWrapperSpan.find('.count');
                    if ($(this).val() === $(this).attr("max")) {
                        $countSpan.html('');
                        $countWrapperSpan.html($countWrapperSpan.html().replace(' displays', 'Never'));
                    }
                    else {
                        $countSpan.html($(this).val());
                        $countWrapperSpan.html($countWrapperSpan.html().replace('Never', ' displays'));
                    }
                }
            }).mousemove();
        });
        this.selectInterval.onblur = this.saveSelectInterval();
        this.selectInterval.onmouseout = function () {
            let temp = self.selectInterval.value;

            if (temp !== intervalValue) {
                self.saveSelectInterval();
            }
        };
        this.selectDuration.onblur = this.saveSelectDuration();
        this.selectDuration.onmouseout = function () {
            let temp = selectDuration.value;

            if (temp !== durationValue) {
                self.saveSelectDuration();
            }
        };

        this.addCollections();
    };

    Options.prototype.addCollections = function () {
        let self = this;
        $.get('https://langflow.ru/api/v1/collections', {apiKey: this.apiKey}, function (data) {
            if (typeof data.collections !== undefined) {
                if (data.collections.my) {
                    $.each(data.collections.my, function (index, collection) {
                        self.$collections.append(`<div class="checkbox">
                            <input type="checkbox" 
                                   id="collection-${collection.id}"
                                   class="js-collection"
                                   name="collections[]" 
                                   ${self.collections.indexOf(collection.id) > -1 ? 'checked' : ''}
                                   value="${collection.id}">
                            <label for="collection-${collection.id}">${collection.name}</label>
                        </div>`);
                    });
                }

                if (data.collections.public) {
                    self.$collections.append(`<div class="caption font-bold" style="margin-top: 13px;">Public collections</div>`);
                    $.each(data.collections.public, function (index, collection) {
                        self.$collections.append(`<div class="checkbox">
                            <input type="checkbox" 
                                   id="collection-${collection.id}"
                                   class="js-collection"
                                   name="collections[]" 
                                   ${self.collections.indexOf(collection.id) > -1 ? 'checked' : ''}
                                   value="${collection.id}">
                            <label for="collection-${collection.id}">${collection.name}</label>
                        </div>`);
                    });
                }
            }
        });
    };

    Options.prototype.saveSelectInterval = function (newValue) {
        this.settingsArray.selectInterval = this.$selectInterval.val();
        localStorage.setItem('settingsArray', JSON.stringify(this.settingsArray));
        chrome.runtime.sendMessage({type: 'changeSettings'});
    };

    Options.prototype.saveSelectDuration = function (newValue) {
        this.settingsArray.selectDelay = this.$selectDuration.val();
        localStorage.setItem('settingsArray', JSON.stringify(this.settingsArray));
        chrome.runtime.sendMessage({type: 'changeSettings'});
    };

    Options.prototype.saveCollectionIds = function() {
        let collectionIds = [];
        const $collections =  $('.js-collection:checked');
        if ($collections.length === 0) {
            collectionIds = [0];
        }
        else {
            $collections.each(function () {
                collectionIds.push(parseInt($(this).val()));
            });
        }

        this.settingsArray.collectionIds = collectionIds;
        localStorage.setItem('settingsArray', JSON.stringify(this.settingsArray));
        chrome.runtime.sendMessage({type: 'changeSettings'});
    }

    Options.prototype.onShowTestCard = function () {
        drawCard({
            source: 'Word',
            translation: 'Translation',
            translateFrom: 'en',
        }, this.settingsArray);
    };

    Options.prototype.onShowTestNotification = function () {
        chrome.runtime.sendMessage({type: 'showNotification'});
    };

    /**
     * Show test Notification.
     *
     * @returns {boolean}
     */
    Options.prototype.onShowTestNotification = function () {
        chrome.runtime.sendMessage({type: 'showNotification'});
        return false;
    }

    Options.prototype.initFormEvents = function() {
        let self = this;

        this.$showNativeCards.on('change', function () {
            self.settingsArray.showNativeCardsChecked = $(this).prop('checked');
            localStorage.setItem('settingsArray', JSON.stringify(self.settingsArray));
            chrome.runtime.sendMessage({type: 'changeSettings'});
        });

        this.$showNotificationCards.on('change', function () {
            self.settingsArray.showNotificationCardsChecked = $(this).prop('checked');
            localStorage.setItem('settingsArray', JSON.stringify(self.settingsArray));
            chrome.runtime.sendMessage({type: 'changeSettings'});
        });

        this.$showTestCard.on('click', function (e) {
            e.preventDefault();
            self.onShowTestCard();
        });

        this.$showTestNotofication.on('click', function (e) {
            e.preventDefault();
            self.onShowTestNotification();
        });

        $(document).on('click', '.js-sign-in', function (e) {
            e.preventDefault();
            self.onSignIn($(this));
        });

        $(document).on('click', '.js-close', function () {
            window.close();
        });

        $(document).on('click', '.js-collection', function (e) {
            self.saveCollectionIds();
        });
    };

    $(document).ready(function(){
        var options = new Options();

        if ($.langFlow === undefined)
            $.langFlow = {};

        $.langFlow.options = options;
    });

}(window.jQuery);
