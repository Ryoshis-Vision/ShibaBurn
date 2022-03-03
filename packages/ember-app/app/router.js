import EmberRouter from '@ember/routing/router';
import config from 'app/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('index', { path: '/' }, function() {
  });
	this.route('details', { path: '/details' }, function() {});
	this.route('burn', { path: '/burn' }, function() {
		this.route('token', { path: '/:token' }, function() {});
	});
  this.route('buy-and-burn', { path: '/buy-and-burn/:token' }, function() {
	});
});
