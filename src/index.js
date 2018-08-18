import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Chart from "react-google-charts";
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
global.jQuery = $;

const api = 'https://gitlab.com/api/v4/projects/7423776/';
const merge_requests = 'merge_requests';
const commits_url = 'repository/commits';
const access_token = {private_token:'fQxrL4nktV6g2K3x9UaN'};

const commits = {
	options : {
		title: "Commits",
		legend: {position: 'none'},
		hAxis: {title: 'Date'},
		vAxis: {title: 'No. of Commits'}
	},
	data : [["Date","Commits"]],
	url : api+commits_url,
	success : function (result) {
		let map = {};
		result.forEach(function(item) {
			const date = (new Date(item.committed_date)).toLocaleDateString();
			if (date in map) {
				map[date] += 1;
			} else {
				map[date] = 1;
			}
		});
		return map;
	} 
};
const contributors = {
	options : {
		title: "Unique Contributors",
		legend: {position: 'none'},
		hAxis: {title: 'Date'},
		vAxis: {title: 'No. of Contributors'}
	},
	data : [["Date","Contibutors"]],
	url : api+commits_url,
	success : function (result) {
		let map = {};
		result.forEach(function(item) {
			const date = (new Date(item.committed_date)).toLocaleDateString();
			if (date in map) {
				map[date].add(item.author_name);
			} else {
				map[date] = new Set([item.author_name]);
			}
		});
		for (let key in map) {
			map[key] = map[key].size;
		}
		return map;
	} 
};
const newRequests = {
	options : {
		title: "New Pull Requests",
		legend: {position: 'none'},
		hAxis: {title: 'Date'},
		vAxis: {title: 'Pull Requests'}
	},
	data : [["Date","Pull Requests"]],
	url : api+merge_requests+'?state=opened',
	success : function (result) {
		let map = {};
		result.forEach(function(item) {
			const date = (new Date(item.created_at)).toLocaleDateString();
			if (date in map) {
				map[date] += 1;
			} else {
				map[date] = 1;
			}
		});
		return map;
	} 
};
const mergedRequests = {
	options : {
		title: "Merged Pull Requests",
		legend: {position: 'none'},
		hAxis: {title: 'Date'},
		vAxis: {title: 'Pull Requests'}
	},
	data : [["Date","Pull Requests"]],
	url : api+merge_requests+'?state=merged',
	success : function (result) {
		let map = {};
		result.forEach(function(item) {
			const date = (new Date(item.created_at)).toLocaleDateString();
			if (date in map) {
				map[date] += 1;
			} else {
				map[date] = 1;
			}
		});
		return map;
	} 
};

class Select extends React.Component {
	constructor(props) {
		super(props);
		this.state = {value:1};
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(e) {
		const value = e.target.value;
		this.setState({value});
		this.props.onchange(value);
	}

	render () {
		return (
			<select className="time" name="period" value={this.state.value} onChange={this.handleChange}>
				<option value="1">7 days</option>
				<option value="2">1 month</option>
				<option value="3">6 months</option>
			</select>
		);
	}
}

class Metric extends React.Component {
	constructor(props) {
		super(props);
		this.state = props.state;
		this.state.period = props.period;
		this.state.map = {};
		this.componentDidMount = this.componentDidMount.bind(this);
		this.addData = this.addData.bind(this);
		this.componentDidUpdate = this.componentDidUpdate.bind(this);
	}

	static getDerivedStateFromProps(nextProps, prevState){
		if(nextProps.period!==prevState.period){
			return { period: nextProps.period};
		}
		else return null;
	}

	componentDidUpdate(prevProps, prevState) {
		if(prevProps.period!==this.props.period) {
		    this.setState({period: this.props.period});
		    this.addData('called');
		}
	}

	addData(callee) {
		let data = [this.state.data[0]];
		let period;
		let map = this.state.map;
		switch(parseInt(this.state.period,10)) {
			case 1: 
				period = 6; 
				break;
			case 2: 
				period = 29; 
				break;
			case 3: 
				period = 179; 
				break;
			default: break;
		}
		for (var i=period; i>=0; i--) {
			let d = new Date();
			d.setDate(d.getDate() - i);
			d = d.toLocaleDateString();
			if (d in map) {
				data.push([new Date(d),map[d]]);
			} else {
				data.push([new Date(d), 0]);
			}
		} 
		this.setState({data});
	}

	componentDidMount () {
		const self = this;
		$.ajax({
			url:self.state.url,
			method:'GET',
			data: access_token,
			success: function (result) {
				const map = self.state.success(result);
				self.setState({map});
				self.addData();
			}
		});
	}

	render () {
		return (
			<div className="metrics">
		        <Chart
		          chartType="LineChart"
		          width="100%"
		          height="400px"
		          data={this.state.data}
		          options={this.state.options}
		        />
	      	</div>
		);
	}
}

class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			period: 1,
		};
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(period) {
		this.setState({period});
	}

	render () {
		return (
			<div className="dashboard">
				<div className='selector'>
					<Select onchange={this.handleChange}/>
				</div>
				<div className='graphs'>
					<Metric state={newRequests} period={this.state.period}/>
					<Metric state={mergedRequests} period={this.state.period}/>
					<Metric state={commits} period={this.state.period}/>
					<Metric state={contributors} period={this.state.period}/>
				</div>
			</div>
		);
	}
}

ReactDOM.render(
	<Dashboard/>,
	document.getElementById('root')
)