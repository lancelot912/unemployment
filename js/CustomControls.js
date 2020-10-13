// Mini-detail pane to display in the corner of the map on mobile
var MiniDetailPane = L.Control.extend({
    options: {
        position: 'bottomleft'
    },

    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'mini-detail-pane');

        $(container).append('<p>Confirmed Cases</p><p>in selected region:</p><hr>');
        $(container).append('<p><span class="lblRegionName"></span>: <span class="lblCases"></span> (<span class="lblPercent"></span>)</p>');
        $(container).append('<p>World Total: <span class="lblWorldTotal"></span></p>');

        return container
    }
});
