import _ from 'lodash';
import OS from 'os';
import Path from 'path';
import {EventEmitter} from 'events';
import {Map as immutableMap} from 'immutable';
import routesBuilder from './app/Routes';
import mkdirp from 'mkdirp';
import buildServer from 'expressjs-boilerplate/lib/server/Server';
import md5 from 'md5';
import fs from 'fs';
import AnalyticsServer from './AnalyticsServer';
import constants from './../constants';


//
// cli specific includes
//

/*const INDICES_CONFIG_FIELDS = [
 'instanceName',
 'indicesConfig',
 'logLevel',
 'esConfig',
 'redisConfig',
 'redisSentinelConfig',
 'locksConfig',
 'cacheConfig'
 ];*/

/*const SEARCH_CONFIG_FIELDS = [
 'instanceName',
 'searchConfig',
 'transliterator',
 'logLevel',
 'esConfig',
 'redisConfig',
 'redisSentinelConfig',
 'locksConfig',
 'cacheConfig'
 ];*/

const ANALYTICS_CONFIG_FIELDS = [
    'instanceName',
    'loginConfiguration',
    'logLevel',
    'esConfig',
    'redisConfig',
    'redisSentinelConfig',
    'locksConfig',
    'cacheConfig'
];

export default class Server {
    constructor(multiInstance, port, logDirectory) {
        this.multiInstance = multiInstance;
        this.port = port;
        this.configs = {};
        this.services = {};
        this.analytics = {};
        this.logDirectory = logDirectory;

        //this.eventEmitter = new EventEmitter(); //dont require this

        this._built = false;
    }

    withPlugin(config) {
        this.addConfig(config);

        return this;
    }

    /*withPlugins(configs) {
     _.forEach(configs, config => this.addConfig(config));

     return this;
     }*/

    build() {
        const _this = this;

        function cockpitPropertiesBuilder(params) {
            /*if (_this.multiInstance) {
             if (!params || !params.instanceName || !_this.configs[params.instanceName]) {
             throw new Error('No such instance found: ', params);
             }

             const instanceName = params.instanceName;

             let baseUrl = null;
             let resourcesPrefix = null;
             let searcherApiPrefix = '';
             if (params.X_INSTANCE_BASE) {
             let instanceBase = params.X_INSTANCE_BASE;
             if (instanceBase.endsWith('/')) {
             instanceBase = instanceBase.substring(0, instanceBase.length - 1);
             }

             if (!instanceBase.startsWith('/') && instanceBase.length > 0) {
             instanceBase = `/${instanceBase}`;
             }

             baseUrl = resourcesPrefix = searcherApiPrefix = instanceBase;
             } else if (params.X_PROXY_BASE) {
             let proxyBase = params.X_PROXY_BASE;
             if (proxyBase.endsWith('/')) {
             proxyBase = proxyBase.substring(0, proxyBase.length - 1);
             }

             if (!proxyBase.startsWith('/') && proxyBase.length > 0) {
             proxyBase = `/${proxyBase}`;
             }

             baseUrl = resourcesPrefix = searcherApiPrefix = `${proxyBase}/${instanceName}`;
             } else {
             baseUrl = resourcesPrefix = searcherApiPrefix = instanceName;
             }

             return _.defaultsDeep({
             multiInstance: _this.multiInstance,
             instanceName,
             searcherApi: `${searcherApiPrefix}/searcher/api`,
             baseUrl,
             title: `${_.startCase(instanceName)} Cockpit`,
             resourcesPrefix
             },
             _this.configs[instanceName].cockpitConfig);
             }*/

            console.log(`Arka Config 1 -- ${JSON.stringify(_this.configs)}`);
            const configTmp = _.defaultsDeep({
                    instanceName: 'default',
                    //searcherApi: '/searcher/api',
                    title: 'Cockpit'
                },
                _this.configs.default.cockpitConfig);

            console.log(`Final Config --- ${JSON.stringify(configTmp)}`);
            return configTmp;
        }

        //passwordless config
        const configuration = JSON.parse(
            fs.readFileSync(constants.configurationFile)
        );

        console.log(`Arka Config 2 -- ${JSON.stringify(_this.configs)}`);
        // build indexer, searcher and add them to services
        const logDirectory = this.logDirectory || Path.join(OS.homedir(), 'humane_discovery_logs');

        console.log(`Log directory -- ${logDirectory}`);

        // create directory if it does not exist
        mkdirp.sync(logDirectory);

        const mainConfig = {
            port: this.port,

            logDirectory,

            //eventEmitter: this.eventEmitter,

            api: {
                services: _.values(this.services)
            },

            client: {
                multiInstance: this.multiInstance,
                routes: routesBuilder(immutableMap({multiInstance: this.multiInstance})),
                properties: cockpitPropertiesBuilder, // properties to be passed to the client
                publicPath: Path.join(__dirname, '../public'),
                resourcesPath: Path.join(__dirname, '../__public__')
            }
        };

        if (configuration.passwordless) {
            mainConfig.login_config = configuration.passwordless;

            console.log(`\n\n configuration loaded --- ${mainConfig.login_config}   \n\n`);
        }

        buildServer(mainConfig);

        this._built = true;

        return this;
    }

    addConfig(config) {
        // through event add the config
        // if (!this.multiInstance && this.configs.default) {
        //     console.error('For single instance can not add config more than once: ', config);
        //     return false;
        // }

        const instanceName = this.multiInstance ? config.instanceName : 'default';

        if (!config.instanceName) {
            config.instanceName = instanceName;
        }
        console.log(config.esConfig);

        //need to remove the below block of code.
        console.log('Login information -- ');//dashboardConfig
        const loginConfArr = config.loginConfiguration;

        _.forEach(loginConfArr, (confObj) => {
            console.log(confObj);
        });

        //initilize the cockpit config ---
        config.cockpitConfig = {};

        console.log(`Dashboard Configuration --- ${config.dashboardConfig}`);
        config.cockpitConfig.dashboardConfig = config.dashboardConfig;

        console.log('Instance Name: ', instanceName);
        config.cockpitConfig.loginInfo = loginConfArr; //need to remove this code.

        //load a josn array from server and put it in cockpitConfig.d3Data
        const contents = fs.readFileSync(`${__dirname}/../src/dummy-data.json`);
        const jsonContent = JSON.parse(contents);
        _.forEach(jsonContent, (confObj) => {
            console.log(confObj);
        });

        config.cockpitConfig.d3Data = jsonContent;

        /*if (!config.cockpitConfig.cockpitName) {
         config.cockpitConfig.cockpitName = `${_.startCase(instanceName)} Cockpit`;
         }*/

        /*if (!config.cockpitConfig.views) {
         config.cockpitConfig.views = [];
         }*/

        /*if (!_.some(config.cockpitConfig.views, ['name', 'Search Queries'])) {
         const searchQueriesView = {
         name: 'Search Queries',
         type: 'group',
         items: [
         {
         name: 'Search Queries that has results',
         type: 'data',
         key: md5('searchQuery/true'),
         params: {type: 'searchQuery', filter: {hasResults: true}},
         fields: [
         {Query: 'query'},
         {Count: 'count'}
         ]
         },
         {
         name: 'Search Queries that has no results',
         type: 'data',
         key: md5('searchQuery/false'),
         params: {type: 'searchQuery', filter: {hasResults: false}},
         fields: [
         {Query: 'query'},
         {Count: 'count'}
         ]
         }
         ]
         };

         config.cockpitConfig.views.push(searchQueriesView);
         }*/

        this.configs[instanceName] = config;
        /* this.configs[instanceName] = _.defaultsDeep(config, {
         cockpitConfig: {
         autocomplete: {
         searchQuery: {
         name: 'Search Query',
         statFields: [
         {Count: 'count'}
         ],
         valueField: 'query',
         unicodeValueField: 'unicodeQuery',
         displayField: 'query',
         searchMode: 'autocomplete:popular_search'
         }
         }
         }
         });*/

        // build indexer, searcher, and add to server api through event calls
        //const searcherApiPath = this.multiInstance ? `/${instanceName}/searcher/api` : '/searcher/api';

        const analyticsApiPath = this.multiInstance ? `/${instanceName}/analytics/api` : '/analytics/api';

        const analytics = this.analytics[instanceName] = new AnalyticsServer(_.pick(config, ANALYTICS_CONFIG_FIELDS));
        this.services[`${instanceName}/analytics`] = {path: analyticsApiPath, api: analytics, instanceName};

        //not required
        //const searcher = this.searchers[instanceName] = new Searcher(_.pick(config, SEARCH_CONFIG_FIELDS));
        //this.services[`${instanceName}/searcher`] = {path: searcherApiPath, api: searcher, instanceName};

        //const indexerApiPath = this.multiInstance ? `/${instanceName}/indexer/api` : '/indexer/api';

        //not required
        //const indexer = this.indexers[instanceName] = new Indexer(_.pick(config, INDICES_CONFIG_FIELDS));
        //this.services[`${instanceName}/indexer`] = {path: indexerApiPath, api: indexer, instanceName};

        // emit events
        /*if (this._built) {
         this.eventEmitter.emit('service.add', this.services[`${instanceName}/searcher`]);
         this.eventEmitter.emit('service.add', this.services[`${instanceName}/indexer`]);
         }*/

        console.log(JSON.stringify(config));

        return true;
    }

    removeConfig(name) {
        // through event remove the config
        if (!this.multiInstance) {
            console.error('For single instance can not remove config: ', name);
            return false;
        }

        // TODO: remove the routes from server, destroy Indexer and Searcher
        return true;
    }

    updateConfig(/*config*/) {
        // TODO: through event update the config
    }
}