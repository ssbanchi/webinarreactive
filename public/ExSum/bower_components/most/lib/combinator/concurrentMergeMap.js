/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var AwaitingDisposable = require('../disposable/AwaitingDisposable');
var LinkedList = require('../LinkedList');
var Promise = require('../Promise');

var resolve = Promise.resolve;
var all = Promise.all;

exports.concurrentMergeMap = concurrentMergeMap;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @param {number} concurrency max number of streams to merge concurrently.  At most,
 *  this many inner streams will be active at one time.
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function concurrentMergeMap(f, concurrency, stream) {
	return new Stream(new MergeMap(f, concurrency, stream.source));
}

function MergeMap(f, concurrency, source) {
	this.f = f;
	this.concurrency = concurrency;
	this.source = source;
}

MergeMap.prototype.run = function(sink, scheduler) {
	return new Outer(this.f, this.concurrency, this.source, sink, scheduler);
};

function Outer(f, concurrency, source, sink, scheduler) {
	this.f = f;
	this.concurrency = concurrency;
	this.sink = sink;
	this.scheduler = scheduler;
	this.pending = [];
	this.current = new LinkedList();
	this.disposable = new AwaitingDisposable(source.run(this, scheduler));
	this.active = true;
}

Outer.prototype.event = function(t, x) {
	var f = this.f;
	this._addInner(t, f(x));
};

Outer.prototype._addInner = function(t, stream) {
	if(this.current.length < this.concurrency) {
		this._startInner(t, stream);
	} else {
		this.pending.push(stream);
	}
};

Outer.prototype._startInner = function(t, stream) {
	var innerSink = new Inner(t, this, this.sink);
	this.current.add(innerSink);
	innerSink.disposable = stream.source.run(innerSink, this.scheduler);
};

Outer.prototype.end = function(t, x) {
	this.active = false;
	this.disposable.dispose();
	this._checkEnd(t, x);
};

Outer.prototype.error = function(t, e) {
	this.active = false;
	this.sink.error(t, e);
};

Outer.prototype.dispose = function() {
	this.active = false;
	this.pending.length = 0;
	return all([this.disposable.dispose(), this.current.dispose()]);
};

Outer.prototype._endInner = function(t, x, inner) {
	this.current.remove(inner);
	var self = this;
	resolve(inner.dispose()).catch(function(e) {
		self.error(t, e);
	});

	if(this.pending.length === 0) {
		this._checkEnd(t, x);
	} else {
		this._startInner(t, this.pending.shift());
	}
};

Outer.prototype._checkEnd = function(t, x) {
	if(!this.active && this.current.isEmpty()) {
		this.sink.end(t, x);
	}
};

function Inner(time, outer, sink) {
	this.prev = this.next = null;
	this.time = time;
	this.outer = outer;
	this.sink = sink;
	this.disposable = void 0;
}

Inner.prototype.event = function(t, x) {
	this.sink.event(Math.max(t, this.time), x);
};

Inner.prototype.end = function(t, x) {
	this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner.prototype.error = function(t, e) {
	this.outer.error(Math.max(t, this.time), e);
};

Inner.prototype.dispose = function() {
	return this.disposable.dispose();
};
