RdioTrack = Backbone.Model.extend({ });

TrackCollection = Backbone.Collection.extend({
  model: RdioTrack,

  comparator: function(rdioTrack) {
    return rdioTrack.get('trackNum');
  }

});

RdioAlbum = Backbone.Model.extend({

  initialize: function() {
    this.trackCollection = new TrackCollection;
  },

  sync: function(method, model, options) {
    if(method === 'read') {

      if (model.id.indexOf('http') >= 0) {
        requestBody = {
          method: 'getObjectFromUrl',
          content: {
            url: model.id,
            extras: 'tracks'
          }
        };
      } else {
        requestBody = {
          method: 'get',
          content: {
            keys: model.id,
            extras: 'tracks'
          }
        };
      }

      requestBody.success = function(response) {
        if (options.success) {
          options.success(response);
        }
      };
      requestBody.error = function(response) {
        if (options.error) {
          options.error(response);
        }
      };

      R.request(requestBody);

    }
  },

  parse: function(response) {
    if (this.id.indexOf('http') >= 0) {
      return response.result;
    } else {
      return response.result[this.id];
    }
  },

  set: function(attributes, options) {
    // Update the track collection and then remove it from the attributes

    if (this.trackCollection !== undefined) {
      this.trackCollection.reset(attributes.tracks)
    }
    delete attributes.tracks

    return Backbone.Model.prototype.set.call(this, attributes, options);
  }
});

RdioTrackView = Backbone.View.extend({
  tagName: 'div',

  className: 'col-lg-2',

  template: _.template($('#album-track').html()),

  events: {
    'click .track-play-button': 'playTrack'
  },

  playTrack: function() {
    var trackKey = this.model.get('key');

    R.player.play({
      source: trackKey
    });;
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }
});

RdioALbumView = Backbone.View.extend({
  initialize: function() {
    var self = this;
    this.model.bind('change', this.render, this);
  },

  render: function() {
    var self = this;

    var albumTitleTemplate = _.template($('#tpl-album-name').html());
    this.$el.find('#album-name').html(albumTitleTemplate(this.model.toJSON()));

    var tracksEl = this.$el.find('#tracks')

    tracksEl.empty();

    this.model.trackCollection.each(function(track) {

      renderedTrack = new RdioTrackView({
        model: track
      }).render();

      tracksEl.append(renderedTrack.el);

    });

    return this;
  }
})

var albumKey = 'a58717'; // Star Trek

queryParams = _.toQueryParams(location.search.slice(1));
if (_.has(queryParams, 'id')) {
  albumKey = queryParams.id;
}

var rdioAlbum = new RdioAlbum({
  id: albumKey
});

var rdioAlbumView = new RdioALbumView({
  el: $("#album-view"),
  model: rdioAlbum
});

R.ready(function() {
  rdioAlbum.fetch();
});
