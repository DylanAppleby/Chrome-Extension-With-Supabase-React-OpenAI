const path = require('path')
const HTMLPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    index: './src/index.tsx',
    content: './src/content/content.ts',
    background: './src/background/background.ts',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: { noEmit: false },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        exclude: /node_modules/,
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                ident: 'postcss',
                plugins: [require('tailwindcss'), require('autoprefixer')],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'manifest.json', to: '../manifest.json' }],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/assets/icon-128.png',
          to: path.join(__dirname, 'dist'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/assets/icon-34.png',
          to: path.join(__dirname, 'dist'),
          force: true,
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/assets/duck.jpg',
          to: path.join(__dirname, 'dist'),
          force: true,
        },
      ],
    }),
    ...getHtmlPlugins(['index']),
  ],
  resolve: {
    alias: {
      assets: path.resolve(__dirname, 'src/assets'),
      background: path.resolve(__dirname, 'src/background'),
      components: path.resolve(__dirname, 'src/components'),
      content: path.resolve(__dirname, 'src/content'),
      context: path.resolve(__dirname, 'src/context'),
      pages: path.resolve(__dirname, 'src/pages'),
      types: path.resolve(__dirname, 'src/types'),
      utils: path.resolve(__dirname, 'src/utils'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].bundle.js',
    clean: true,
  },
}

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HTMLPlugin({
        title: 'React extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  )
}
