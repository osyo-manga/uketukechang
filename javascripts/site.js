function get(url, callback){
	$.ajax({
		type     : 'GET',
		url      : 'https://query.yahooapis.com/v1/public/yql?callback=?&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys',
		timeout  : 100000,
		dataType : 'json',
		data     :
		{
			"q"      : `select * from htmlstring where url='${url}'`,
			"format" : "json"
		}
	}).done((data, err) => {
		callback(data, null);
	}).fail(() => {
		callback(null, 1)
	});
}

function getList(url, callback){
	get(url, (data, err) => {
		if( err ){
			return callback(null, err);
		}

		const users = $($.parseHTML(data.query.results.result)).find(".user")
		const result = Array.from(users).map((elm) => {
			const user = $(elm)
			return {
				label_ptype_name: user.find(".label_ptype_name").text(),
				label_status_tag: user.find(".label_status_tag").text().trim(),
				display_name: user.find(".display_name a").text(),
			};
		});
		callback(result, null);
	});
}

function build(users){
	return users.filter(it => it.label_status_tag == "参加者").reduce((group, it) => {
		if (!group[it.label_ptype_name]){
			group[it.label_ptype_name] = [];
		}
		group[it.label_ptype_name].push({
			display_name: it.display_name,
			label: it.display_name,
			checked: false,
			todos: [
				{
					label: "懇親会費",
					checked: false
				}
			],
			original: it
		});
		return group;
	}, {});
}


new Vue({
	el: '#app',
	data() {
		return {
			input: {
				connpass_url: "",
			},
			debug: false,
			list: null,
			option: {
				all_view: {
					label: "全て表示する",
					value: false,
				}
			},
			defaultProps: {
				children: 'todos',
				label: 'label'
			},
			show: true,
		}
	},
	mounted(){
		this.input.connpass_url = JSON.parse(localStorage.getItem('input.connpass_url')) || '';
		this.list = JSON.parse(localStorage.getItem('list')) || '';

		this.$watch("list", () => {
			localStorage.setItem('list', JSON.stringify(this.list));
		}, { deep: true });

		if( !this.debug ){
			return
		}
// 		this.input.connpass_url = "https://connpass.com/event/86031/participation";
		this.input.connpass_url = "https://student-lt.connpass.com/event/82379/participation";
		getList(this.input.connpass_url, (result) => {
			this.list = build(result);
		});
	},
	methods: {
		onSubmit(){
			console.log(this.input.connpass_url);
			getList(`${this.input.connpass_url}/participation`, (result, err) => {
				if( err ){
					return this.$notify.error({ title: 'Error', message: '読み込みに失敗しました。' });
				}
				localStorage.setItem('input.connpass_url', JSON.stringify(this.connpass_url));
				this.$notify.error({ title: 'Error', message: '読み込みに失敗しました。' });
				console.log(result);
				this.list = build(result);
			});
		},
		markdown(){
			if( !this.list ){
				return "";
			}
			const result = "";
			console.log(this.list);
			return Object.keys(this.list).map(key => {
				return `## ${key}

${ this.list[key].map(user => {
	return `* [${user.checked ? 'x' : ' '}] ${user.display_name}
${user.todos.map(todo => `  * [${todo.checked ? 'x' : ' '}] ${todo.label}`)}
` }).join("\n")
}
`
			}).join("\n");
		}
	}
});
