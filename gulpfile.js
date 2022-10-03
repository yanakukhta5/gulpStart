const gulp = require("gulp")
const {src, dest, watch, series, parallel} = require("gulp")
const fileinclude = require("gulp-file-include")
const htmlmin = require("gulp-htmlmin")
const size = require("gulp-size")
const browserSync = require("browser-sync").create()
const plumber = require("gulp-plumber")
const notify = require("gulp-notify")
const del = require("del")
const concat = require("gulp-concat")
const cssimport = require("gulp-cssimport")
const sourcemaps = require("gulp-sourcemaps")
const autoprefixer = require("gulp-autoprefixer")
const csso = require("gulp-csso")
const rename = require("gulp-rename")
const shorthand = require("gulp-shorthand")
const groupCssMediaQueries = require("gulp-group-css-media-queries")
const gulpSass = require("gulp-sass")(require("sass"))
const sassGlob = require("gulp-sass-glob")
const babel = require("gulp-babel")
const uglify = require("gulp-uglify")
const imagemin = require("gulp-imagemin")
const newer = require("gulp-newer")
const webp = require("gulp-webp")
const webpHTML = require("gulp-webp-html")
const webpCSS = require("gulp-webp-css")
const fonter = require("gulp-fonter")
const ttf2woff2 = require("gulp-ttf2woff2")
const fontfacegen = require("gulp-fontfacegen")
const gulpIf = require("gulp-if")
const svgSprite = require("gulp-svg-sprite")

const isProd = process.argv.includes("--prod")
const isDev = !isProd
console.log(isProd)

const html = function(){
 return src("./src/html/*.html")
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "HTML",
   message: error.message
  }))
 }))
 .pipe(fileinclude())
 .pipe(gulpIf(isProd, webpHTML()) )
 .pipe(dest("./dist"))
 .pipe(gulpIf(isProd, size({title: "Before minifing html" })))
 .pipe(gulpIf(isProd, htmlmin({ collapseWhitespace: true })))
 .pipe(gulpIf(isProd, size({title: "After minifing html" })))
 .pipe(gulpIf(isProd, rename({suffix: ".min"})))
 .pipe(dest("./dist"))
 .pipe(gulpIf(isDev, browserSync.stream()))
}

const svg = () => {
 src("./src/img/svg/monoColor/*.svg")
 .pipe(newer("./dist/img/svg/monoColor"))
 .pipe(svgSprite({
  commonName: 'svg',
  mode: {symbol: {sprite: "../spriteMono.svg"}},
  shape: {dest: 'items-svg', transform: [{svgo:{plugins: [{removeAttrs: {attrs: ['class', 'data-name']}}]}}]}, // , 'fill', 'stroke'
 }))
 .pipe(dest("./dist/img/svg/monoColor"))
 return src("./src/img/svg/multiColor/*.svg")
 .pipe(newer("./dist/img/svg/multiColor"))
 .pipe(svgSprite({
  mode: {symbol: {sprite: "sprite.svg"}},
  shape: {dest: 'items-svg', transform: [{svgo:{plugins: [{removeAttrs: {attrs: ['class', 'data-name']}}]}}]}, 
 }))
 .pipe(dest("./dist/img/svg/multiColor"))
}

const font = () => {
 return src("./src/font/*.+(eot|ttf|otf|otc|ttc|woff|woff2|svg)")
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "FONT",
   message: error.message
  }))
 }))
 .pipe(newer("./dist/font"))
 .pipe(fonter({ formats: ["ttf", "otf"] }))
 .pipe(fonter({ formats: ["eot", "woff", "svg"] }))
 .pipe(dest("./dist/font"))
 .pipe(ttf2woff2())
 .pipe(dest("./dist/font"))
 .pipe(fontfacegen({
   filepath: "./dist/css",
   filename: "fontfacerules.css",
 }))
 .pipe(gulpIf(isDev,browserSync.stream()))
}

const img = () => {
 return src("./src/img/**/*.+(png|jpg|gif|ico|svg|webp|jpeg)")
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "IMG",
   message: error.message
  }))
 }))
 .pipe(newer("./dist/img"))
 .pipe(webp())
 .pipe(dest("./dist/img"))
 .pipe(src("./src/img/**/*.+(png|jpg|gif|ico|svg|webp|jpeg)"))
 .pipe(newer("./dist/img"))
 .pipe(imagemin({ verbose: true }))
 .pipe(dest("./dist/img"))
 .pipe(gulpIf(isDev,browserSync.stream()))
}

const js = () => {
 return src("./src/js/*.js")
 .pipe(gulpIf(isDev, sourcemaps.init()))
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "JS",
   message: error.message
  }))
 }))
 .pipe(gulpIf(isDev, sourcemaps.write()))
 .pipe(dest("./dist/js"))
 .pipe(gulpIf(isProd, babel({presets: ['@babel/preset-env']})))
 .pipe(gulpIf(isProd, size({title: "Before minifing js" })))
 .pipe(gulpIf(isProd, uglify()))
 .pipe(gulpIf(isProd, size({title: "After minifing js" })))
 .pipe(gulpIf(isProd, rename({suffix: ".min"})))
 .pipe(dest("./dist/js"))
 .pipe(gulpIf(isDev,browserSync.stream()))
}

const sass = () => {
 return src("./src/sass/*.{sass, scss}")
 .pipe(gulpIf(isDev, sourcemaps.init()))
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "SASS",
   message: error.message
  }))
 }))
 .pipe(sassGlob())
 .pipe(gulpSass())
 .pipe(webpCSS())
 .pipe(autoprefixer({
  overrideBrowserslist: ['last 3 versions'],
  cascade: false
 }))
 .pipe(shorthand())
 .pipe(gulpIf(isProd, groupCssMediaQueries()))
 .pipe(gulpIf(isProd, size({title: "Before minifing sass" })))
 .pipe(gulpIf(isDev, sourcemaps.write()))
 .pipe(dest("./dist/css"))
 .pipe(rename({suffix: ".min"}))
 .pipe(gulpIf(isProd, csso()))
 .pipe(gulpIf(isProd, size({title: "After minifing sass" })))
 .pipe(gulpIf(isDev, sourcemaps.write()))
 .pipe(dest("./dist/css"))
 .pipe(gulpIf(isDev,browserSync.stream()))
}

const css = () => {
 return src("./src/css/*.css")
 .pipe(gulpIf(isDev, sourcemaps.init()))
 .pipe(plumber({
  errorHandler: notify.onError(error => ({
   title: "CSS",
   message: error.message
  }))
 }))
 .pipe(concat("style.css"))
 .pipe(cssimport())
 .pipe(webpCSS())
 .pipe(autoprefixer({
  overrideBrowserslist: ['last 3 versions'],
  cascade: false
 }))
 .pipe(shorthand())
 .pipe(gulpIf(isProd, groupCssMediaQueries()))
 .pipe(gulpIf(isProd, size({title: "Before minifing css" })))
 .pipe(gulpIf(isDev, sourcemaps.write()))
 .pipe(dest("./dist/css"))
 .pipe(rename({suffix: ".min"}))
 .pipe(gulpIf(isProd, csso()))
 .pipe(gulpIf(isProd, size({title: "After minifing css" })))
 .pipe(gulpIf(isDev, sourcemaps.write()))
 .pipe(dest("./dist/css"))
 .pipe(gulpIf(isDev,browserSync.stream()))
}

const clear = () => {
 return del("./dist")
}

const server = () => {
 browserSync.init({
  server: {
   baseDir: "./dist"
  }
 })
}

const watcher = () => {
watch("./src/html/**/*.html", html)
watch("./src/sass/**/*.{sass, scss}", sass)
watch("./src/js/**/*.js", js)
watch("./src/img/**/*.+(png|jpg|gif|ico|svg|webp|jpeg)", img)
watch("./src/font/**/*.+(eot|ttf|otf|otc|ttc|woff|woff2|svg)", font)
watch("./src/img/svg/*.svg", svg)
}

const prod = series(
 clear,
 parallel(html, sass, js, img, font, svg)
)

exports.html = html
exports.sass = sass
exports.js = js
exports.font = font
exports.img = img
exports.watch = watcher
exports.clear = clear
exports.prod = prod
exports.svg = svg

exports.default = series(
 prod,
 parallel(watcher, server)
)