/* tslint:disable */
/* eslint-disable */
/**
* Should be called once to setup any state that persists across compilation
* cycles.
*/
export function init(): void;
/**
* @param {string} gleam_source
* @returns {any}
*/
export function compile_to_js(gleam_source: string): any;
/**
* @param {string} erlang_source
* @returns {any}
*/
export function compile_to_erlang(erlang_source: string): any;
