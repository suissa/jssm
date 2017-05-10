
// @flow

import type {
  JssmGenericState, JssmGenericConfig,
  JssmTransition, JssmTransitionList,
  JssmMachineInternalState
} from './jssm-types';

const version = null; // replaced from package.js in build





class machine<mNT, mDT> {


  _state                  : mNT;
  _states                 : Map<mNT, JssmGenericState<mNT>>;
  _edges                  : Array<JssmTransition<mNT, mDT>>;
  _edge_map               : Map<mNT, Map<mNT, number>>;
  _named_transitions      : Map<mNT, number>;
  _actions                : Map<mNT, Map<mNT, number>>;
  _reverse_actions        : Map<mNT, Map<mNT, number>>;
//_reverse_action_targets : Map<string, Map<string, mixed>>;  // todo    // remove mixed todo whargarbl


  // whargarbl this badly needs to be broken up, monolith master
  constructor({ initial_state, transitions } : JssmGenericConfig<mNT, mDT>) {

    this._state                  = initial_state;
    this._states                 = new Map();
    this._edges                  = [];
    this._edge_map               = new Map();
    this._named_transitions      = new Map();
    this._actions                = new Map();
    this._reverse_actions        = new Map();
//  this._reverse_action_targets = new Map();  // todo

    transitions.map( (tr:any) => { // whargarbl burn out any

      if (tr.from === undefined) { throw new Error(`transition must define 'from': ${JSON.stringify(tr)}`); }
      if (tr.to   === undefined) { throw new Error(`transition must define 'to': ${  JSON.stringify(tr)}`); }

      // get the cursors.  what a mess
      var cursor_from = this._states.get(tr.from);
      if (cursor_from === undefined) {
        this._new_state({name: tr.from, from: [], to: [], complete: false });
        cursor_from = (this._states.get(tr.from) : any);
      }

      var cursor_to = this._states.get(tr.to);
      if (cursor_to === undefined) {
        this._new_state({name: tr.to, from: [], to: [], complete: false });
        cursor_to = (this._states.get(tr.to) : any);
      }

      // guard against existing connections being re-added
      if (cursor_from.to.includes(tr.to)) { throw new Error(`already has ${tr.from} to ${tr.to}`); }
      else                                { cursor_from.to.push(tr.to); }

      if (cursor_to.from.includes(tr.from)) { throw new Error(`already has ${tr.to} from ${tr.from}`); }
      else                                  { cursor_to.from.push(tr.from); }

      // add the edge; note its id
      this._edges.push(tr);
      const thisEdgeId = this._edges.length - 1;

      // guard against repeating a transition name
      if (tr.name) {
        if (this._named_transitions.has(tr.name)) { throw new Error(`named transition "${tr.name}" already created`); }
        else                                      { this._named_transitions.set(tr.name, thisEdgeId); }
      }

      // set up the mapping, so that edges can be looked up by endpoint pairs
      var from_mapping = this._edge_map.get(tr.from);
      if (from_mapping === undefined) {
        this._edge_map.set(tr.from, new Map());
        from_mapping = (this._edge_map.get(tr.from) : any);  // whargarbl burn out uses of any
      }

      var to_mapping = from_mapping.get(tr.to);
      if (to_mapping) { throw new Error(`from -> to already exists ${tr.from} ${tr.to}`); }
      else            { from_mapping.set(tr.to, thisEdgeId); }

      // set up the action mapping, so that actions can be looked up by origin
      if (tr.action) {

        // forward mapping first by action name
        if (!(this._actions.has(tr.action))) {
          this._actions.set(tr.action, new Map());
        }

        const actionMap = this._actions.get(tr.action);
        if (actionMap) {
          if (actionMap.has(tr.from)) { throw new Error(`action ${tr.action} already attached to origin ${tr.from}`); }
          else {
            actionMap.set(tr.from, thisEdgeId);
          }
        } else {
          throw new Error('should be impossible, satisfying type checker that doesn\'t know .set precedes .get.  severe error?');
        }

        // reverse mapping first by state origin name
        if (!(this._reverse_actions.has(tr.from))) {
          this._reverse_actions.set(tr.from, new Map());
        }

        const rActionMap = this._reverse_actions.get(tr.from);
        if (rActionMap) {
          if (rActionMap.has(tr.action)) { throw new Error(`r-action ${tr.from} already attached to action ${tr.action}`); }
          else {
            rActionMap.set(tr.action, thisEdgeId);
          }
        } else {
          throw new Error('should be impossible, satisfying type checker that doesn\'t know .set precedes .get again.  severe error?')
        }
/*
todo comeback
        // reverse mapping first by state target name
        if (!(this._reverse_action_targets.has(tr.to))) {
          this._reverse_action_targets.set(tr.to, new Map());
        }

        const roActionMap = this._reverse_action_targets.get(tr.to);  // wasteful - already did has - refactor
        if (roActionMap) {
          if (roActionMap.has(tr.action)) { throw new Error(`ro-action ${tr.to} already attached to action ${tr.action}`); }
          else {
            roActionMap.set(tr.action, thisEdgeId);
          }
        } else {
          throw new Error('should be impossible, satisfying type checker that doesn\'t know .set precedes .get yet again.  severe error?')
        }
*/

      }
    });

  }

  _new_state(state_config : JssmGenericState<mNT>) : mNT { // whargarbl get that state_config any under control
    if (this._states.has(state_config.name)) { throw new Error(`state ${(state_config.name:any)} already exists`); }
    this._states.set(state_config.name, state_config);
    return state_config.name;
  }



  state() : mNT {
    return this._state;
  }

  is_changing() : boolean {
    return true; // todo whargarbl
  }

  is_final() : boolean {
    return ( (!this.is_changing()) && (this.is_terminal()) && (this.is_complete()) );
  }



  machine_state() : JssmMachineInternalState<mNT, mDT> {

    return {
      internal_state_impl_version : 1,

      actions                : this._actions,
      edge_map               : this._edge_map,
      edges                  : this._edges,
      named_transitions      : this._named_transitions,
      reverse_actions        : this._reverse_actions,
//    reverse_action_targets : this._reverse_action_targets,
      state                  : this._state,
      states                 : this._states
    };

  }

  load_machine_state() : boolean {
    return false; // todo whargarbl
  }



  states() : Array<mNT> {
    return [... this._states.keys()];
  }

  transitions() : Array< JssmTransition<mNT, mDT> > {
    return this._edges;
  }

  named_transitions() : Map<mNT, number> {
    return this._named_transitions;
  }

  actions() : Array<mNT> {
    return [... this._actions.keys()];
  }



  edge_id(from: mNT, to: mNT) {
    return this._edge_map.has(from)? (this._edge_map.get(from) : any).get(to) : undefined;
  }

  edge(from: mNT, to: mNT) {
    const id = this.edge_id(from, to);
    return (id === undefined)? undefined : this._edges[id];
  }



  transitions_for(whichState : mNT) : JssmTransitionList<mNT> {
    return {entrances: this.entrances_for(whichState), exits: this.exits_for(whichState)};
  }

  entrances_for(whichState : mNT) : Array<mNT> {
    return (this._states.get(whichState) || {}).from; // return undefined if it doesn't exist by asking for a member of an empty obj
  }

  exits_for(whichState : mNT) : Array<mNT> {
    return (this._states.get(whichState) || {}).to;
  }



  actions_for(whichState : mNT) : Array<mNT> {
    const wstate = this._reverse_actions.get(whichState);
    if (wstate) { return [... (wstate || new Map()).keys()]; }
    else        { throw new Error(`No such state ${JSON.stringify(whichState)}`); }
  }

  action_found_on_states(whichState : mNT) : Array<mNT> {
    return [... ((this._actions.get(whichState) || new Map()).keys() || [])]; // wasteful
  }
/*
todo comeback
  action_entrances_at(whichState : string) : Array<mixed> { // whargarbl remove mixed
    return [... (this._reverse_action_targets.get(whichState) || new Map()).values()] // wasteful
           .map( (edgeId:any) => (this._edges[edgeId] : any)) // whargarbl burn out any
           .filter( (o:any) => o.to === whichState)
           .map( filtered => filtered.from );
  }
*/

  action_exits_at(whichState : mNT) : Array<mNT> {
    return [... (this._reverse_actions.get(whichState) || new Map()).values()] // wasteful
           .map( (edgeId:number) => this._edges[edgeId] ) // whargarbl burn out any
           .filter( o => o.from === whichState)
           .map( filtered => filtered.to );
  }



  is_unenterable(whichState : mNT) : boolean {
    return this.entrances_for(whichState).length === 0;
  }

  has_unenterables() : boolean {
    return this.states.some(this.is_unenterable);
  }



  is_terminal() : boolean {
    return this.state_is_terminal(this.state());
  }

  state_is_terminal(whichState : mNT) : boolean {
    return this.exits_for(whichState).length === 0;
  }

  has_terminals() : boolean {
    return this.states.some(this.state_is_terminal);
  }



  is_complete() : boolean {
    return this.state_is_complete(this.state());
  }

  state_is_complete(whichState : mNT) : boolean {
    const wstate = this._states.get(whichState);
    if (wstate) { return wstate.complete; }
    else        { throw new Error(`No such state ${JSON.stringify(whichState)}`); }
  }

  has_completes() : boolean {
    return this.states.some(this.state_is_complete);
  }



  action(name : mNT, newData? : mDT) : boolean {
    return false; // major todo whargarbl
  }

  transition(newState : mNT, newData? : mDT) : boolean {
    // todo whargarbl implement hooks
    // todo whargarbl implement data stuff
    if (this.valid_transition(newState, newData)) {
      this._state = newState;
      return true;
    } else {
      return false;
    }
  }

  // can leave machine in inconsistent state.  generally do not use
  force_transition(newState : mNT, newData? : mDT) : boolean {
    // todo whargarbl implement hooks
    // todo whargarbl implement data stuff
    if (this.valid_force_transition(newState, newData)) {
      this._state = newState;
      return true;
    } else {
      return false;
    }
  }



  valid_action(action : mNT, newData? : mDT) : boolean {
    return false; // major todo whargarbl
  }

  valid_transition(newState : mNT, newData? : mDT) : boolean {
    // todo whargarbl implement hooks
    // todo whargarbl implement data stuff
    return (this.edge(this.state(), newState) !== undefined);
  }

  valid_force_transition(newState : mNT, newData? : mDT) : boolean {
    return false; // major todo whargarbl
  }



  viz() {
    const l_states = this.states();
    const node_of = (state) => `n${l_states.indexOf(state)}`;

    const nodes = l_states.map( (s:any) => `${node_of(s)} [label="${s}"];`).join(' ');

    const strike = [];
    const edges  = this.states().map( (s:any) =>

      this.exits_for(s).map( (ex:any) => {

        if ( strike.find(row => (row[0] === s) && (row[1] == ex) ) ) {
            return '';  // already did the pair
        }

        const edge         = this.edge(s, ex),
              pair         = this.edge(ex, s),
              double       = pair && (s !== ex),

//            label        = edge  ? ([edge.name?`${(edge.name:any)}`:undefined,`${(edge.probability:any)}`]
//                                   .filter(not_undef => !!not_undef)
//                                     .join('\n') || undefined
//                                    ) : undefined,

              if_obj_field = (obj, field) => obj? obj[field] : undefined,

              label        = edge  ? (`label="${    (edge.name        : any)}";` || '') : '',
              headlabel    = pair  ? (`headlabel="${(pair.probability : any)}";` || '') : '',
              taillabel    = edge  ? (`taillabel="${(edge.probability : any)}";` || '') : '',

              labelInline  = [
                               [edge, 'name',        'label'],
                               [pair, 'probability', 'headlabel'],
                               [edge, 'probability', 'taillabel']
                             ]
                             .map(    r       => ({ which: r[2], whether: if_obj_field(r[0], r[1]) }) )
                             .filter( present => present.whether )
                             .map(    r       => `${r.which}="${(r.whether : any)}"`)
                             .join(' '),

              edgeInline   = edge  ? (double? 'dir=both;color="#777777:#555555"' : 'color="#555555"') : '';

        if (pair) { strike.push([ex, s]); }

        return `${node_of(s)}->${node_of(ex)} [${labelInline}${edgeInline}];`;

      }).join(' ')

    ).join(' ');

    return `digraph G {\n  fontname="helvetica neue";\n  style=filled;\n  bgcolor=lightgrey;\n  node [shape=box; style=filled; fillcolor=white; fontname="helvetica neue"];\n  edge [fontsize=9;fontname="helvetica neue"];\n\n  ${nodes}\n\n  ${edges}\n}`;

  }


}





export {

  machine,

  version

};
