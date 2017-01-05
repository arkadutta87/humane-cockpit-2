import React from 'react';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import NavBarContainer from 'reactjs-web-boilerplate/lib/app/components/NavBarContainer';
import _ from 'lodash';
import QueryString from 'qs';
import Store from './DashBoardSearchNilStore';

import BarChart from './../../search/components/BarChart';

const DashboardStoreKey = 'DashboardSearchNilStore';

let ConfigData = {
    selected_data: {
        category: 'search',
        percentage: 5,
        time_interval: 60,
        instance_name: ''
    },
    data_barchart_ua: [
        {letter: 'chrome', frequency: 171},
        {letter: 'firefox', frequency: 49},
        {letter: 'netscape', frequency: 17},
        {letter: 'ie', frequency: 29},
        {letter: 'webkit', frequency: 16},
        {letter: 'opera-mini', frequency: 37}
    ],
    data_barchart_city: [
        {letter: 'chennai', frequency: 23},
        {letter: 'mumbai', frequency: 79},
        {letter: 'kolkata', frequency: 59},
        {letter: 'delhi', frequency: 99},
        {letter: 'pune', frequency: 11},
        {letter: 'bengaluru', frequency: 89}
    ],
    options: [
        {
            category: 'search',
            flag: true
        },
        {
            category: 'autocomplete',
            flag: false
        }
    ],
    header: 'Top Zero Results Search Queries Chart',
    bread_crumb: [
        {name: 'Search'},
        {name: 'Top search queries/time'}
    ],
    summary: {
        Total_Queries: 3999,
        Time_Period: 'last 12 hours',
        Average_Response_Time: 18.77
    },
    percentage: [
        {
            value: 5,
            flag: true
        },
        {
            value: 10,
            flag: false
        },
        {
            value: 15,
            flag: false
        }
    ],
    time_interval: [
        {
            value: '1 h',
            flag: true,
            numeric_val: 60
        },
        {
            value: '6 h',
            flag: false,
            numeric_val: 360
        },
        {
            value: '12 h',
            flag: false,
            numeric_val: 720
        },
        {
            value: '1 d',
            flag: false,
            numeric_val: 1440
        },
        {
            value: '3 d',
            flag: false,
            numeric_val: 4320
        },
        {
            value: '1 w',
            flag: false,
            numeric_val: 10080
        },
        {
            value: '1 m',
            flag: false,
            numeric_val: 43200
        },
        {
            value: '3 m',
            flag: false,
            numeric_val: 129600
        },
        {
            value: '6 m',
            flag: false,
            numeric_val: 259200
        }
    ],
    real_data: []
};

/*
 <img src={dt1.image_1}
 alt="User-Agent Wise Representation" width="100%"/>
 */

const userContext = '__userContext__';

let dashboardHome = React.createClass({

    mixins: [FluxControllerMixin],

    getInitialState() {
        const userContxtObj = this.getAppProperties().get(userContext);
        if (userContxtObj) {
            //const userName = userContxtObj.get('name');
            const instanceName = userContxtObj.get('instanceName');
            ConfigData.selected_data.instance_name = instanceName;
        }

        this.store = this.getFluxController().createStore(Store, DashboardStoreKey, ConfigData);

        this.registerStores({
            [DashboardStoreKey]: {dataKey: 'dashboardNilResultsData'}
        });

        return {
            dashboardNilResultsData: this.store.data
        };
    },

    /*hitTheServer(){
     console.log('Inside the server call api.');
     const dashBoardHomeData = this.store.data;

     const key = 'selected_data';
     const dataConcerned = dashBoardHomeData.get(key).toJS();

     return this.store.hitServerForSearchQueriesVisualization(dataConcerned);
     },*/

    componentDidMount(){
        console.log('Component Will mount have been called for DashBoardHome .');
        this.store.hitTheServer();

        console.log('The server have been hit');
    },


    tableDataBlock(dt, barData1, barData2){

        const margin = {top: 20, right: 10, bottom: 30, left: 40};
        const width = 320;
        const height = 120;

        console.log('Data -- ', dt.toJS());

        const innerBlock = dt.toJS().map((dt1) => {
            return (<tr>
                <td>{dt1.name}</td>
                <td>{dt1.count}</td>
                <td>
                    <div className="overlay-data"><h6>Dummy Data</h6></div>
                    <BarChart
                        data={barData1}
                        width={width}
                        height={height}
                        margin={margin}/>
                </td>
                <td>
                    <div className="overlay-data"><h6>Dummy Data</h6></div>
                    <BarChart
                        data={barData2}
                        width={width}
                        height={height}
                        margin={margin}/>
                </td>
            </tr>);
        });


        return (<table className="m14">
            <thead>
            <tr>
                <th>Queries</th>
                <th>Count</th>
                <th>User-Agent Wise Representation</th>
                <th>City Wise Representation</th>
            </tr>
            </thead>
            <tbody>
            {innerBlock}
            </tbody>
        </table>);
    },

    categoryBlock(dt){

        const innerBlock = dt.toJS().map((dt1) => {
            let classNm = '';
            if (dt1.flag) {
                classNm = `${classNm} option-clicked`;
            }
            const index = 3;
            return (
                <span className={classNm} onClick={this.buttonClicked(index, dt1.category)}> {dt1.category} </span>);
        });

        return (<div className="chart-clickable-middle">
            {innerBlock}
        </div>);
    },

    percentageBlock(dt){

        const innerBlock = dt.toJS().map((dt1) => {
            let classNm = '';
            if (dt1.flag) {
                classNm = `${classNm} option-clicked`;
            }
            const index = 1;
            return (<span className={classNm} onClick={this.buttonClicked(index, dt1.value)}>{dt1.value} %</span>);
        });

        return (<div className="chart-clickable-left">
            {innerBlock}
        </div>);
    },

    timeIntervalBlock(dt){

        const innerBlock = dt.toJS().map((dt1) => {
            let classNm = '';
            if (dt1.flag) {
                classNm = `${classNm} option-clicked`;
            }

            const index = 2;
            return (<span className={classNm} onClick={this.buttonClicked(index, dt1.numeric_val)}>{dt1.value}</span>);
        });

        return (<div className="chart-clickable-right">
            {innerBlock}
        </div>);
    },

    summaryBlock(dt){
        const dataTmp = dt.toJS();

        if (dataTmp === null) {
            return null;
        }

        return (<div className="chart-summary">
            <table>
                <tbody>
                <tr>
                    <td className="td-underline">Time Period - {dataTmp.Time_Period}</td>
                    <td>Total Search Queries - {dataTmp.Total_Search_Queries}</td>
                </tr>
                </tbody>
            </table>
        </div>);
    },

    buttonClicked(index, value){

        return (e) => {

            console.log(`Button have been clicked with values --- ${index}, ${value}`);
            const dashBoardHomeData = this.state.dashboardNilResultsData;
            const selectedDataTmp = dashBoardHomeData.get('selected_data').toJS();
            let flag = false;

            if (index === 1) {
                if (selectedDataTmp.percentage === value) {
                    console.log('Value same do nothing');
                } else {
                    selectedDataTmp.percentage = value;
                    const percentData = dashBoardHomeData.get('percentage').toJS();

                    const newData = percentData.map((dt1) => {

                        if (dt1.value === value) {
                            dt1.flag = true;
                        } else {
                            dt1.flag = false;
                        }

                        return dt1;
                    });

                    const baseData = dashBoardHomeData.toJS();
                    baseData.selected_data = selectedDataTmp;
                    baseData.percentage = newData;

                    this.store.setData(baseData);
                    //this.hitTheServer();
                    flag = true;
                }
            } else if (index === 2) {

                if (selectedDataTmp.time_interval === value) {
                    console.log('Value same do nothing');
                } else {
                    selectedDataTmp.time_interval = value;
                    const timeData = dashBoardHomeData.get('time_interval').toJS();

                    const newData = timeData.map((dt1) => {

                        if (dt1.numeric_val === value) {
                            dt1.flag = true;
                        } else {
                            dt1.flag = false;
                        }

                        return dt1;
                    });

                    const baseData = dashBoardHomeData.toJS();
                    baseData.selected_data = selectedDataTmp;
                    baseData.time_interval = newData;

                    this.store.setData(baseData);
                    //this.hitTheServer();
                    flag = true;
                }
            } else if (index === 3) {

                if (selectedDataTmp.category === value) {
                    console.log('Value same do nothing');
                } else {
                    selectedDataTmp.category = value;

                    const optionsData = dashBoardHomeData.get('options').toJS();

                    const newData = optionsData.map((dt1) => {

                        if (dt1.category === value) {
                            dt1.flag = true;
                        } else {
                            dt1.flag = false;
                        }

                        return dt1;
                    });

                    const baseData = dashBoardHomeData.toJS();
                    baseData.selected_data = selectedDataTmp;
                    if (value === 'autocomplete') {
                        baseData.header = 'Top Zero Results Auto-Complete Queries Chart';
                    } else {
                        baseData.header = 'Top Zero Results Search Queries Chart';
                    }

                    baseData.options = newData;

                    this.store.setData(baseData);
                    //this.hitTheServer();
                    flag = true;
                }
            }

            if (flag) {
                this.store.hitTheServer();
            }
        };

    },

    render() {
        console.log('Inside the dashboard-home page render');
        //const configuration = this.getAppProperties().get('dashboardConfig');

        const dashBoardHomeData = this.state.dashboardNilResultsData;

        console.log('Data@render -- ',dashBoardHomeData.toJS());

        const headerStr = dashBoardHomeData.get('header');
        //const brCrBl = this.breadCrumbBlock(dashBoardHomeData.get('bread_crumb'));
        const summBlock = this.summaryBlock(dashBoardHomeData.get('summary'));
        const optionsBlock = this.categoryBlock(dashBoardHomeData.get('options'));
        const perBlock = this.percentageBlock(dashBoardHomeData.get('percentage'));
        const timeInBlock = this.timeIntervalBlock(dashBoardHomeData.get('time_interval'));

        const tableDataBlock = this.tableDataBlock(dashBoardHomeData.get('real_data'), dashBoardHomeData.get('data_barchart_ua').toJS(),
            dashBoardHomeData.get('data_barchart_city').toJS());

        //ui code --
        return (<div className="row backgrnd-theme-2">
                <div className="chart-wrapper">
                    <div className="block-1">
                        <div className="chart-header">{headerStr}</div>
                        {summBlock}
                    </div>
                    <div className="block-2">
                        {perBlock}
                        {optionsBlock}
                        {timeInBlock}
                    </div>
                    <div className="block-3">
                        {tableDataBlock}
                    </div>
                </div>
            </div>
        );
    }

});

export default dashboardHome;