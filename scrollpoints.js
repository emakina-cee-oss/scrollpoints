Scrollpoints = (function (undefined) {

    var exports = {};
    
    var body = document.body;
    var viewportHeight = window.innerHeight;
    var elements = [];
    var options = {
        once: true,
        reversed: false,
        when: 'entered', // 'entered', 'entering', 'left', 'leaving'
        offset: 0
    };


    var extendOptions = function (userOptions) {
        if (userOptions === undefined) {
            userOptions = {};
        }
        var combined = {};
        for (var key in options) {
            combined[key] = options[key];
            if (userOptions.hasOwnProperty(key)) {
                combined[key] = userOptions[key];
            }
        }
        return combined;
    };


    var elementBegin = function (domElement) {
        return domElement.offsetTop;
    };

    var elementEnd = function (domElement) {
        return elementBegin(domElement) + domElement.offsetHeight;
    };

    var windowTopPos = function () {
        return (window.scrollY || document.documentElement.scrollTop);
    };

    var windowBottomPos = function () {
        return windowTopPos() + window.innerHeight;
    };


    var entering = function (e) {
        if (e.reversed) return !e.done && windowTopPos() < elementEnd(e.element) - e.offset;
        return !e.done && windowBottomPos() > elementBegin(e.element) + e.offset;
    };

    var entered = function (e, overrideReversed) {

        // reversed can be overridden to check if a leaving+reversed element entered non-reverse.
        var reversed = overrideReversed === undefined ? e.reversed : overrideReversed;

        if (reversed) return !e.done && windowTopPos() < elementBegin(e.element) - e.offset;
        return !e.done && windowBottomPos() > elementEnd(e.element) + e.offset;
    };

    var leaving = function (e) {
        if (e.reversed) return !e.done && windowBottomPos() < elementEnd(e.element) - e.offset;
        return !e.done && windowTopPos() > elementBegin(e.element) + e.offset;
    };

    var left = function (e) {
        if (e.reversed) return !e.done && windowBottomPos() < elementBegin(e.element) - e.offset;
        return !e.done && windowTopPos() > elementEnd(e.element) + e.offset;
    };


    exports.add = function (domElement, callback, options) {
        var opts = extendOptions(options);
        
        // scrollpoints which trigger functions on 'leave' or 'leaving' will be activated when they
        // enter the screen the first time, because when detected as not on viewport, leave functions
        // fire immediately.
        var activeInitially = (opts.when === 'entered' || opts.when === 'entering') ? true : false;

        elements.push({
            element: domElement,
            callback: callback,

            once: opts.once,
            reversed: opts.reversed,
            when: opts.when,
            offset: opts.offset,

            active: activeInitially, 

            done: false
        });
    };

    window.addEventListener('scroll', function () {
        elements.forEach(function (elem, index, array) {

            if (!elem.active && (elem.when === 'leaving' || elem.when === 'left') && (entered(elem, !elem.reversed))) {
                elem.active = true;
            }

            var shouldFire =    elem.when === 'entered' && entered(elem) || 
                                elem.when === 'entering' && entering(elem) || 
                                elem.when === 'leaving' && leaving(elem) || 
                                elem.when === 'left' && left(elem);

            if (elem.active && shouldFire) {
                elem.callback.call(window, elem.element);
                elem.done = true;

                if (!elem.once) {
                    if(elem.when === 'entered' || elem.when === 'entering') {
                        exports.add(elem.element, function () { elem.done = false; }, {when: 'left', reversed: !elem.reversed});
                    }
                    if(elem.when === 'left' || elem.when === 'leaving') {
                        exports.add(elem.element, function () { elem.done = false; }, {when: 'entered', reversed: !elem.reversed});
                    }
                }
            }

        });
    });

    return exports;

})();