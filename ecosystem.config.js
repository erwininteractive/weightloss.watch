module.exports = {
	apps: [
		{
			name: "wlt",
			script: "./dist/server.js",
			instances: 2, // or 'max' to use all CPU cores
			exec_mode: "cluster",
			env_file: ".env.production",
			error_file: "./logs/pm2-error.log",
			out_file: "./logs/pm2-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			max_memory_restart: "500M",
			autorestart: true,
			watch: false,
			merge_logs: true,
			env: {
				NODE_ENV: "production",
			},
		},
	],
};
