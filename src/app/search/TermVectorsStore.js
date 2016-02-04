import Immutable from 'immutable';

import FluxStore from 'reactjs-web-boilerplate/lib/app/flux/FluxStore';

export default class extends FluxStore {
    constructor(key, fluxContext, fluxController) {
        super(key, fluxContext, fluxController);

        this.data = Immutable.fromJS({params: null, result: []});
    }

    termVectors(params) {
        if (Immutable.is(params, this.data.get('params'))) {
            // we do not do anything
            return this;
        }

        const requestTime = Date.now();

        return this.fluxContext.restClient.get(`${this.fluxController.appProperties.get('searcherApi')}/${params.get('type')}/${params.get('id')}/termVectors`)
          .then((result) => {
              const totalTimeTaken = (Date.now() - requestTime);

              if (result && result.entity) {
                  const data = this.data
                    .set('params', params)
                    .set('result', Immutable.fromJS(result.entity))
                    .set('totalTimeTaken', totalTimeTaken)
                    .set('serviceTimeTaken', result.entity.serviceTimeTaken)
                    .set('queryTimeTaken', result.entity.queryTimeTaken);

                  return this.updateData(data);
              }

              return null;
          })
          .catch(() => null);
    }
}