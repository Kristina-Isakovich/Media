
const project_folder = require("path").basename(__dirname);
const source_folder = "src";

const fs =require('fs');

const path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/app.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + project_folder + "/"
}

const { src, dest } = require('gulp');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const groupMedia = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

function server() {
  browserSync.init({
    server: {
      baseDir: "./" + project_folder + "/"
    },
    port: 3002,
    notify: false,
  })
}

function html() {
  return src(path.src.html)
    .pipe(fileInclude())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream())
}

function css() {
  return src(path.src.css)
    .pipe(scss({outputStyle: "expanded"}))
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 10 versions'],
        cascade: true
      })
    )
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(rename({extname: ".min.css"}))
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream())
}

function js() {
  return src(path.src.js)
    .pipe(fileInclude())
    .pipe(dest(path.build.js))
    .pipe(terser())
    .pipe(rename({extname: ".min.js"}))
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream())
}

function images() {
  return src(path.src.img)
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 3,
      svgoPlugins: [{ removeViewBox: false }]
    }))
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream())
}

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

gulp.task('otf2ttf', function () {
  return src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'));
})

function fontsStyle() {
  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname !== fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() { }

function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

const clean = () => del(path.clean)

const build = gulp.series(clean, gulp.parallel(css, js, html, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, server);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;
