'use strict';
const {chain_func} = require('../utils.js');
const mob_symbols = require('./mob.js')._symbols;

class VisibilityGroup {
	constructor() {
		this.atoms = new Set();
		this.atoms.add = chain_func(this.atoms.add, (prev, item) => {
			let ret = prev();
			if(!item[mob_symbols._visgroups].includes(this))
				item[mob_symbols._visgroups].push(this);
			this.override_changed(null, {atom: item});
			return ret;
		});
		this.atoms.delete = chain_func(this.atoms.delete, (prev, item) => {
			let ret = prev();
			let idx = item[mob_symbols._visgroups].indexOf(this);
			item[mob_symbols._visgroups].splice(idx, 1);
			this.override_changed(null, {atom: item});
			return ret;
		});
		this.viewers = new Set();
		this.viewers.add = chain_func(this.viewers.add, (prev, item) => {
			let ret = prev();
			item.c.Eye[mob_symbols._visgroups].add(this);
			this.override_changed(null, {viewer: item});
			return ret;
		});
		this.viewers.delete = chain_func(this.viewers.delete, (prev, item) => {
			let ret = prev();
			item.c.Eye[mob_symbols._visgroups].delete(this);
			this.override_changed(null, {viewer: item});
			return ret;
		});
		this.overrides = new Map();
		this.overrides.set = chain_func(this.overrides.set, (prev, key) => {
			let ret = prev();
			this.override_changed(key);
			return ret;
		});
		this.overrides.delete = chain_func(this.overrides.delete, (prev, key) => {
			let ret = prev();
			this.override_changed(key);
			return ret;
		});
		this.overrides.clear = chain_func(this.overrides.clear, (prev) => {
			let keys = [...this.overrides.keys()];
			let ret = prev();
			for(let key of keys) {
				this.override_changed(key);
			}
			return ret;
		});
	}

	override_changed(key, {viewer = null, atom = null} = {}) {
		if(viewer == null) {
			for(viewer of this.viewers) {
				this.override_changed(key, {viewer, atom});
			}
			return;
		} else if(atom == null) {
			for(atom of this.atoms) {
				this.override_changed(key, {viewer, atom});
			}
			return;
		} else if(key == null) {
			for(key of this.overrides.keys()) {
				this.override_changed(key, {viewer, atom});
			}
			return;
		}
		let match;
		if(key == "visible") {
			// Special snowflakey code for when this changes visibility...
			// which is what this class will probably be used for 99% of the time.
			if(viewer.c.Eye.can_see(atom))
				viewer.c.Eye[mob_symbols._add_viewing](atom);
			else
				viewer.c.Eye[mob_symbols._remove_viewing](atom);
		} else if((match = key.match(/^([^.]+)$/i))) {
			let netid = viewer.c.Eye[mob_symbols._server_to_net][atom.object_id];
			if(netid)
				viewer.c.Eye.enqueue_update_atom_var(netid, atom, match[1], 0);
		}
	}
}

module.exports = VisibilityGroup;