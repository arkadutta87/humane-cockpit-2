import React from 'react';
import FluxControllerMixin from 'reactjs-web-boilerplate/lib/app/flux/FluxControllerMixin';
import _ from 'lodash';
import QueryString from 'qs';
import Store from './../DashBoardStore';

const DashboardStoreKey = 'DashboardStore';

/*
 <div className="inner-content-wrapper">
 <div className="row backgrnd-theme-1">

 <ul className="breadcrumb breadcrumb_custom">
 <li className="breadcrumb-active">
 <a href="#">Search</a>
 </li>
 <li className="breadcrumb-active">
 <a href="#">Top search queries/time</a>
 </li>
 <li className="breadcrumb-active">
 <a href="#">Chart1</a>
 </li>
 </ul>
 </div>
 </div>
 */

let component = React.createClass({

    mixins: [FluxControllerMixin],

    render() {

        return (<div>
                <div className="row backgrnd-theme-2">
                    <div className="chart-wrapper">
                        <div className="block-1">
                            <div className="chart-header">Nil Result Queries Chart</div>
                            <div className="chart-summary">
                                <table>
                                    <tr>
                                        <td className="td-underline">Time Period - last 6 hour/s</td>
                                        <td>Total Queries - 3748</td>
                                        <td>Percentage of total queries - 2.72 %</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        <div className="block-2">
                            <div className="chart-clickable-left">
                                <span className="option-clicked">5 %</span><span>10 %</span><span>15 %</span>
                            </div>
                            <div className="chart-clickable-middle">
                                <span className="option-clicked">search</span><span>autocomplete</span>
                            </div>
                            <div className="chart-clickable-right">
                                <span>1 hour</span>
                                <span className="option-clicked">6 hours</span>
                                <span>12 hours</span>
                                <span>1 day</span>
                                <span >3 days</span>
                                <span>1 week</span>
                                <span>1 month</span>
                                <span>3 months</span>
                                <span>6 months</span>
                            </div>
                        </div>
                        <div className="block-3">
                            <table className="m14">
                                <thead>
                                <tr>
                                    <th>Queries</th>
                                    <th>Count</th>
                                    <th>User-Agent Wise Representation</th>
                                    <th>City Wise Representation</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                <tr>
                                    <td>Hyundai i20 sports edition</td>
                                    <td>351</td>
                                    <td><img src="/resources/images/User-agent.jpg"
                                             alt="User-Agent Wise Representation" width="100%"/></td>
                                    <td><img src="/resources/images/city.jpg"
                                             alt="City Wise Representation" width="100%"/></td>
                                </tr>
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

export default component;