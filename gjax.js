// copyright andy guerrera / aguerrera@yahoo.com
// MIT License
// all rights reserved

// usage attributes:
//      gjax-section=some-name  : enable gjax replacements
//      gjax-enable=true : put that attribute in your <form> or your <a> markup to allow gjax form submissions or links. the response will fill in the appropriate gjax-section
//      gjax-modal=true: clicking will put response contents in modal
//      gjax-modal-title: set the modal title
//      gjax-modal-content=true : content can be used in modal
//      gjax-modal-hide=true:  hide if in modal
//
// events:
//  gjax.submit.before : fired before form is gjax-submitted
//  gjax.submit.after : fired after form is gjax-submitted
//  gjax.navigate.before : fired before gjax makes navigation request
//  gjax.navigate.after : fired after gjax navigation is complete
//  gjax.modal.before : fired before gjax makes modal request
//  gjax.modal.after : fired after gjax modal is open


var GJax;
(function (GJax) {

    var isInitialized = false;
    var settings = {
        globalModalId: "#global-gjax-modal"
    };

    var sectionUpdate = function (data) {
        var these = $("[gjax-section]");
        these.each(function (i) {
            var hps = $(this).attr("gjax-section");
            var htmlupdate = $(data).find("[gjax-section='" + hps + "']");
            if (htmlupdate.length > 0) {
                $(this).html(htmlupdate.html());
            }
        });
    };
    var submitTheForm = function(theForm, e) {
        var action = window.location.pathname + window.location.search;
        var method = "POST";
        if (theForm.attr("method")) {
            method = theForm.attr("method");
        }
        if (theForm.attr("action")) {
            action = theForm.attr("action");
        }
        var submitData = theForm.find(":not([gjax-alt])").serialize();


        var altdata = "";
        theForm.find("[alt-name]").each(function (n) {
            var altName = $(this).attr("alt-name");
            if (altdata != "") {
                altdata += "&";
            }
            altdata += altName + '=' + encodeURIComponent( $(this).val())
        });

        if (altdata != "") {
            if (submitData != "") {
                altdata = "&" + altdata;
            }
            submitData += altdata;
        }
        $.event.trigger({
            type: "gjax.submit.before",
            submitData: submitData,
            time: new Date(),
            originalEvent: e
        });
        $.ajax({
            url: action,
            method: method,
            dataType: "html",
            data: submitData,
            success: function (data) {
                sectionUpdate(data);

                $.event.trigger({
                    type: "gjax.submit.after",
                    responseData: data,
                    time: new Date(),
                    originalEvent: e
                });

                return false;
            }
        });


    };

    var setFormSubmssion = function () {
        $("form[gjax-enable]").each(function (n) {
            var thisForm = $(this);
            if (thisForm.attr("gjax-init")) {
                return;
            }
            thisForm.attr("gjax-init", true);
        });
        $(document).on('click', "form[gjax-enable] button[name]", function (e) {
            e.preventDefault();
            var theButton = this;
            var thisForm = $(theButton).closest("form");
            var v = $(theButton).val();
            var name = $(theButton).attr("name");
            if (thisForm.find('#gjax-val-' + name).length == 0) {
                thisForm.append("<input type='hidden' id='gjax-val-" + name + "' gjax-alt alt-name='" + name + "' name='gjax-val-" + name + "'>")
            }
            thisForm.find('#gjax-val-' + name).val(v);
            submitTheForm(thisForm, e);
        });


        $(document).on("submit", "form[gjax-enable]", function (e) {
            e.preventDefault();
            var thisForm = $(this);
            submitTheForm(thisForm, e);
            return false;
        });
    };

    var setLinkClicky = function () {

        $(document).on("click", "a[gjax-enable]", function (e) {
            var url = $(this).attr('href');
            if (!url) {
                return false;
            }
            e.preventDefault();

            $.event.trigger({
                type: "gjax.navigate.before",
                url: url,
                time: new Date(),
                originalEvent: e
            });
            $.ajax({
                url: url,
                method: "GET",
                dataType: "html",
                success: function (data) {
                    sectionUpdate(data);
                    $.event.trigger({
                        type: "gjax.navigate.after",
                        url: url,
                        responseData: data,
                        time: new Date(),
                        originalEvent: e
                    });

                    return false;
                }
            });
            return false;
        });
    };

    var setModalLinks = function () {
        var modalIsEnabled = (typeof $().modal == 'function'); // check to see if modal is enabled.  bootstrap generally.
        if (!modalIsEnabled) {
            return false;
        }
        $(document).on('click', "[gjax-modal='true']", function (e) {
            var url = $(this).attr('href');
            if (!url) {
                return false;
            }
            e.preventDefault();
            var txt = $(this).text();
            var modalTitle = $(this).attr('gjax-modal-title');
            if (!modalTitle) {
                modalTitle = txt;
            }
            var modalId = $(this).attr('gjax-modal-id');
            if (!modalId) {
                modalId = settings.globalModalId;
            }
            $.event.trigger({
                type: "gjax.modal.before",
                url: url,
                time: new Date(),
                originalEvent: e
            });

            $.ajax({
                url: url,
                method: 'GET',
                dataType: "html",
                success: function (data) {
                    var content = $(data).find('[gjax-modal-content]').html();
                    if (content) {
                        $(modalId).find('.modal-title').html(modalTitle);
                        $(modalId).find('.modal-body').html(content);
                        $(modalId).find('[gjax-modal-hide=true]').hide();
                        $(modalId).modal("show");
                    }

                    $.event.trigger({
                        type: "gjax.modal.after",
                        url: url,
                        time: new Date(),
                        originalEvent: e
                    });

                    return false;
                }
            });
            return false;
        });
    };

    GJax.refreshPage = function(updateUrl) {
        if (!updateUrl) {
            updateUrl = window.location.pathname + window.location.search;
        }
        $.ajax({
            url: updateUrl,
            method: "GET",
            dataType: "html",
            success: function (data) {
                window.setTimeout(function () {
                    sectionUpdate(data);
                }, 200);

            }
        });
    }


    GJax.init = function (p) {
        var enableLinks = true;
        var enableForms = true;
        var enableModals = true;
        if (isInitialized) {
            return;
        }
        isInitialized = true;
        if (p) {
            if (p.globalModalId) {
                settings.globalModalId = p.globalModalId;
            }
            if (p.enableForms) {
                enableForms = p.enableForms;
            }
            if (p.enableModals) {
                enableModals = p.enableModals;
            }
            if (p.enableLinks) {
                enableLinks = p.enableLinks;
            }
        }

        if (enableForms) {
            setFormSubmssion();
        }
        if (enableModals) {
            setModalLinks();
        }
        if (enableLinks) {
            setLinkClicky();
        }
    };


})(GJax || (GJax = {}));

