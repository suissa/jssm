
import {test, describe} from 'ava-spec';

const jssm = require('../../build/jssm.es5.js');





test('build-set version number is present', t => t.is(typeof jssm.version, 'string'));

const seq = upTo => new Array(upTo).fill(false).map( (_,i) => i );





describe('Simple stop light', async it => {

  const light = new jssm.machine({
    initial_state: 'red',
    transitions:[
      { name:'switch_warn', action: 'proceed', from:'green',  to:'yellow' },
      { name:'switch_halt', action: 'proceed', from:'yellow', to:'red'    },
      { name:'switch_go',   action: 'proceed', from:'red',    to:'green'  }
    ]
  });

  const r_states = light.states();
  it('has the right state count', t => t.is(r_states.length, 3));
  ['red', 'yellow', 'green'].map(c =>
    it(`has state "${c}"`, t => t.is(r_states.includes(c), true))
  );

  const r_names = light.named_transitions();
  it('has the right named transition count', t => t.is(r_names.size, 3));
  ['switch_warn', 'switch_halt', 'switch_go'].map(a =>
    it(`has named transition "${a}"`, t => t.is(r_names.has(a), true))
  );

});





describe('Stochastic weather', async it => {

  const weather = new jssm.machine({

    initial_state: 'breezy',

    transitions:[

      { from: 'breezy',  to: 'breezy',  probability: 0.4  },
      { from: 'breezy',  to: 'sunny',   probability: 0.3  },
      { from: 'breezy',  to: 'cloudy',  probability: 0.15 },
      { from: 'breezy',  to: 'windy',   probability: 0.1  },
      { from: 'breezy',  to: 'rain',    probability: 0.05 },

      { from: 'sunny',   to: 'sunny',   probability: 0.5  },
      { from: 'sunny',   to: 'hot',     probability: 0.15 },
      { from: 'sunny',   to: 'breezy',  probability: 0.15 },
      { from: 'sunny',   to: 'cloudy',  probability: 0.15 },
      { from: 'sunny',   to: 'rain',    probability: 0.05 },

      { from: 'hot',     to: 'hot',     probability: 0.75 },
      { from: 'hot',     to: 'breezy',  probability: 0.05 },
      { from: 'hot',     to: 'sunny',   probability: 0.2  },

      { from: 'cloudy',  to: 'cloudy',  probability: 0.6  },
      { from: 'cloudy',  to: 'sunny',   probability: 0.2  },
      { from: 'cloudy',  to: 'rain',    probability: 0.15 },
      { from: 'cloudy',  to: 'breezy',  probability: 0.05 },

      { from: 'windy',   to: 'windy',   probability: 0.3  },
      { from: 'windy',   to: 'gale',    probability: 0.1  },
      { from: 'windy',   to: 'breezy',  probability: 0.4  },
      { from: 'windy',   to: 'rain',    probability: 0.15 },
      { from: 'windy',   to: 'sunny',   probability: 0.05 },

      { from: 'gale',    to: 'gale',    probability: 0.65 },
      { from: 'gale',    to: 'windy',   probability: 0.25 },
      { from: 'gale',    to: 'torrent', probability: 0.05 },
      { from: 'gale',    to: 'hot',     probability: 0.05 },

      { from: 'rain',    to: 'rain',    probability: 0.3  },
      { from: 'rain',    to: 'torrent', probability: 0.05 },
      { from: 'rain',    to: 'windy',   probability: 0.1  },
      { from: 'rain',    to: 'breezy',  probability: 0.15 },
      { from: 'rain',    to: 'sunny',   probability: 0.1  },
      { from: 'rain',    to: 'cloudy',  probability: 0.3  },

      { from: 'torrent', to: 'torrent', probability: 0.65 },
      { from: 'torrent', to: 'rain',    probability: 0.25 },
      { from: 'torrent', to: 'cloudy',  probability: 0.05 },
      { from: 'torrent', to: 'gale',    probability: 0.05 }

    ]

  });

});





describe('Complex stop light', async it => {

  const light2 = new jssm.machine({

    initial_state: 'off',

    transitions:[

      { name:'turn_on',     action:'power_on',  from:'off',    to:'red'},

      {                     action:'power_off', from:'red',    to:'off', probability: 0.01 },
      {                     action:'power_off', from:'yellow', to:'off', probability: 0.01 },
      {                     action:'power_off', from:'green',  to:'off', probability: 0.01 },

      { name:'switch_warn',                     from:'green',  to:'yellow' },
      { name:'switch_halt',                     from:'yellow', to:'red'    },
      { name:'switch_go',                       from:'red',    to:'green'  }

    ]

  });

  const r_states = light2.states();
  it('has the right state count', t => t.is(r_states.length, 4));
  ['red', 'yellow', 'green', 'off'].map(c =>
    it(`has state "${c}"`, t => t.is(r_states.includes(c), true))
  );

  const r_names = light2.named_transitions();
  it('has the right named transition count', t => t.is(r_names.size, 4));
  ['turn_on', 'switch_warn', 'switch_halt', 'switch_go'].map(a =>
    it(`has named transition "${a}"`, t => t.is(r_names.has(a), true))
  );

  it.describe('transition walkthrough', async it2 => {

    it2('machine starts off',    t => t.is("off",    light2.state()));
    it2('off refuses green',     t => t.is(false,    light2.transition('green')));
    it2('off refuses yellow',    t => t.is(false,    light2.transition('yellow')));

    it2('off accepts red',       t => t.is(true,     light2.transition('red')));
    it2('off is now red',        t => t.is("red",    light2.state()));
    it2('red refuses yellow',    t => t.is(false,    light2.transition('yellow')));
    it2('red still red',         t => t.is("red",    light2.state()));
    it2('red refuses red',       t => t.is(false,    light2.transition('red')));
    it2('red still red',         t => t.is("red",    light2.state()));

    it2('red accepts green',     t => t.is(true,     light2.transition('green')));
    it2('red now green',         t => t.is("green",  light2.state()));
    it2('green refuses red',     t => t.is(false,    light2.transition('red')));
    it2('green still green',     t => t.is("green",  light2.state()));
    it2('green refuses green',   t => t.is(false,    light2.transition('green')));
    it2('green still green',     t => t.is("green",  light2.state()));

    it2('green accepts yellow',  t => t.is(true,     light2.transition('yellow')));
    it2('green now yellow',      t => t.is("yellow", light2.state()));
    it2('yellow refuses green',  t => t.is(false,    light2.transition('green')));
    it2('yellow still yellow',   t => t.is("yellow", light2.state()));
    it2('yellow refuses yellow', t => t.is(false,    light2.transition('yellow')));
    it2('yellow still yellow',   t => t.is("yellow", light2.state()));

    it2('yellow accepts red',    t => t.is(true,     light2.transition('red')));
    it2('back to red',           t => t.is("red",    light2.state()));

  });

});





describe('Illegal machines', async it => {

  it('catch repeated names', t => t.throws(() => {

    const same_name = new jssm.machine({
      initial_state: 'moot',
      transitions:[
        { name:'identical', from:'1', to:'2' },
        { name:'identical', from:'2', to:'3' }
      ]
    });

  }, Error));

});
