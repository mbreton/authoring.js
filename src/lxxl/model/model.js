jsBoot.use('jsBoot.types.TypedMutable');
jsBoot.use('jsBoot.types.getPooledMutable');
jsBoot.use('jsBoot.types.ArrayMutable');
jsBoot.use('jsBoot.types.utils');
jsBoot.use('jsBoot.core.Error');
jsBoot.use('jsBoot.service.core').as('servicesCore');
jsBoot.use('LxxlLib.service.activities', true).as('service');
jsBoot.pack('LxxlLib.model', function(api) {
  'use strict';

  /**
   * This is the base model describing activities metadata
   */

  this.Matter = api.getPooledMutable({
    id: '',
    title: ''
  });

  this.Level = api.getPooledMutable({
    id: '',
    title: ''
  });

  this.Length = api.getPooledMutable({
    id: 0,
    title: ''
  });

  this.Difficulty = api.getPooledMutable({
    id: '',
    title: ''
  });

  this.Flavor = api.getPooledMutable({
    id: '',
    title: ''
  });

  var catDescriptor = {
    id: 0,
    title: '',
    matter: this.Matter,
    level: this.Level
  };

  this.Category = api.getPooledMutable(catDescriptor);
  // Mutate the descriptor to workaround the loop problem
  catDescriptor.content = api.ArrayMutable.bind({}, this.Category);


  /**
   * This is the activity model itself
   */
  this.Answer = api.TypedMutable.bind({}, {
    text: '',
    comment: '',
    isCorrect: false,
    weight: 0
  });

  this.Question = api.TypedMutable.bind({}, {
    coef: 0,
    text: '',
    isQRM: false,
    answers: api.ArrayMutable.bind({}, this.Answer)
  });

  this.Page = api.TypedMutable.bind({}, {
    flavor: this.Flavor,
    title: 'Titre par défaut',
    subtitle: '',
    advice: '',
    hasDocument: false,
    document: '',
    tat: '',
    limitedTime: 0,// // 0 == infinity - X seconds = time
    coef: 0,
    sequencing: -1,// -1 = follow through | 0 = random sur la totalité | X = random sur un subset
    displayHoles: false,
    displayHolesRandomly: false, // false = alphabetical, true = random

    displayAll: false,
    questions: api.ArrayMutable.bind({}, this.Question)
  });


  this.User = api.TypedMutable.bind({}, {
    uid: '',
    username: ''
  });

  var SubActivity = api.TypedMutable.bind({}, {
    title: '',
    description: '',
    contributors: api.ArrayMutable.bind({}, this.User),
    extraContributors: api.ArrayMutable.bind({}, ''),
    level: new this.Level({id: 'other'}),
    matter: new this.Matter({id: 'other'}),
    duration: new this.Length({id: 0}),
    difficulty: new this.Difficulty({id: 'easy'}),
    category: api.ArrayMutable.bind({}, this.Category),
    thumbnailUrl: null,
    pages: api.ArrayMutable.bind({}, this.Page)
  });

  var Activity = api.TypedMutable.bind({}, {
    id: '',
    creationDate: Date,
    publicationDate: Date,
    author: this.User,
    seenCount: 0,
    isDeleted: false,
    isPublished: false,
    isReported: false,
    draft: SubActivity,
    published: SubActivity
  });

  var success = function() {
  };

  var failure = function() {
    throw new api.Error('CREATION_FAILURE', 'Failed saving activity to service');
  };

  this.Activity = function(initialMesh) {
    var i = new Activity(initialMesh);
    i.draft.set('controller', this);

    // var i = {};
    // var i.draft = new Activity(initialMesh);
    // var i.published = new Activity(initialMesh);

    i.pull = function() {
      console.warn(api.service, this.id);
      if (!this.id || !api.service)
        return;
      console.warn("pullklihnnihn");
      api.service.read((function(d) {
        console.warn("----------------->", d);
        this.fromObject(d);
      }.bind(this)), failure, this.id);
    };

    i.push = function() {
      if (!api.service)
        return;
      if (!this.id) {
        api.service.create((function(d) {
          this.set('id', d.id);
        }.bind(this)), failure, this.toObject());
      }else {
        var p = this.draft.toObject();
        api.service.patch(success, failure, this.id, p);
      }
    };

    i.addMedia = function(blob, success, error) {
      if (!this.id || !api.service)
        return;
      api.service.addMedia(function(d){
        success('//' + api.servicesCore.requestor.hostPort + d.url);
      }, function(){
      }, this.id, blob);
    };

    i.setThumbnail = function(blob) {
      if (!this.id || !api.service)
        return;
      api.service.addThumbnail((function(d){
        this.draft.set('thumbnailUrl', '//' + api.servicesCore.requestor.hostPort + d.url + '?' + Math.random());
      }.bind(this)), function(){}, this.id, blob);
    };

    i.removeThumbnail = function(blob){
      this.draft.set('thumbnailUrl', null);
      if (!this.id || !api.service)
        return;
      // XXX not plugged service-side
      // api.service.addThumbnail((function(d){
      //   console.warn("sucessfully published thumbnail blob with return", d);
      //   this.set('thumbnailUrl', d);
      // }.bind(this)), function(){}, this.id, blob);
    };

    var d = i.destroy;
    i.destroy = function() {
      if (this.id && api.service)
        api.service.remove(success, failure, this.id);
      d.apply(this);
    };

    i.report = function() {
      if (!this.id || !api.service)
        return;
      api.service.report(success, failure, this.id);
    };

    i.unreport = function() {
      if (!this.id || !api.service)
        return;
      api.service.unreport(success, failure, this.id);
    };

    i.seen = function() {
      if (!this.id || !api.service)
        return;
      api.service.seen(success, failure, this.id);
    };

    // Should imply a push
    i.publish = function() {
      if (!this.id || !api.service)
        return;
      api.service.publish(success, failure, this.id);
    };

    i.unpublish = function() {
      if (!this.id || !api.service)
        return;
      api.service.unpublish(success, failure, this.id);
    };
    return i;
  };
});
