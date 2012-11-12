#!/usr/bin/env puke
# -*- coding: utf8 -*-

global PH
import helpers as PH
import re
import json

@task("Default task")
def default():
  executeTask("build")
  # executeTask("tests")
  executeTask("deploy")

@task("All")
def all():
  executeTask("lint")
  executeTask("hint")
  executeTask("build")
  # executeTask("tests")
  executeTask("mint")
  executeTask("deploy")
  executeTask("doc")
  executeTask("stats")


@task("Wash the taupe!")
def clean():
  PH.cleaner()

@task("jsDocking")
def doc():
  list = FileList(Yak.build_root)
  # jsdoc3(list, Yak.doc_root + "/jsdoc3.json")
  d = FileSystem.abspath(Yak.doc_root)
  jsdoc3(list, "%s/gristaupe.json" % d)
  jsdoc3(list, "%s/html" % d, template = "templates/default")


@task("Lint")
def lint():
  PH.linter("src/app")
  PH.linter("src/assets")
  PH.linter("src/miniboot")

  # PH.linter("src/bootstrap")
  # PH.linter("src/lib/ember")
  # PH.linter("src/lib/roxee")
  # PH.linter("src/lib/utils")
  # PH.linter("src/lib/widgets")

@task("Hint")
def hint():
  PH.hinter("src/app")
  PH.hinter("src/assets")
  PH.hinter("src/miniboot")

  # PH.hinter("src/miniboot/")
  # PH.hinter("src/lib/", excluding = "*jquery.ui*,*jquery.effects*")
  # PH.hinter("src/app/", excluding = "*tests*")

@task("Fhint")
def fhint():
  PH.fhinter("src/app")
  PH.fhinter("src/assets")
  PH.fhinter("src/miniboot")

@task("Flint")
def flint():
  PH.flinter("src/app")
  PH.flinter("src/assets")
  PH.flinter("src/miniboot")
  # PH.flinter("src/bootstrap")
  # PH.flinter("src/lib/ember")
  # PH.flinter("src/lib/roxee")
  # PH.flinter("src/lib/utils")
  # PH.flinter("src/lib/widgets")

# @task("Deploy package")
# def deploy():
#   # Redirect deploy though
#   Yak.deploy_root = Yak.deploy_root + '/' + Yak.package['name']
#   PH.deployer(False)

@task("Deploy package")
def deploy():
  PH.deployer(False)


@task("Minting")
def mint():
  PH.minter(Yak.build_root)

@task("Stats report deploy")
def stats():
  PH.stater(Yak.build_root)


@task("Building the taupe!")
def build():
  sed = Sed()
  PH.replacer(sed)

  bootman = PH.getmanifest('jsboot')

  sed.add('{JSBOOT}', bootman['jsbootstrap'].encode('latin-1'))
  sed.add('{MINIBOOT}', 'miniboot-min.js')

  sed.add('{PUKE_ANALYTICS}', Yak.ACCESS['GA'])
  sed.add('{PUKE_FBKEY}', Yak.ACCESS['FACEBOOK']['KEY'])
  sed.add('{PUKE_KEY}', Yak.ACCESS['LXXL']['KEY'])
  sed.add('{PUKE_SECRET}', Yak.ACCESS['LXXL']['SECRET'])

  BOOTSTRAP_BUILD = FileSystem.join(Yak.build_root)
  VERSIONED_ROOT = FileSystem.join(Yak.build_root, Yak.package['version'])


  # ================================
  # Bootstrap
  # ================================
  miniboot = FileList("src/miniboot/common/" , filter="*.js")
  combine(miniboot, BOOTSTRAP_BUILD + '/miniboot.js', replace=sed)
  combine(miniboot, BOOTSTRAP_BUILD + '/miniboot-min.js', replace=sed)

  copyfile("src/miniboot/miniboot.ico", Yak.build_root + "/miniboot.ico")
  copyfile("src/miniboot/miniboot.png", Yak.build_root + "/miniboot.png")


  combine('src/miniboot/index.html', BOOTSTRAP_BUILD + '/index.html', replace=sed)



  # ================================
  # Modeling as an Ember application
  # ================================

  # ================================
  # Helpers libraries
  # ================================
  helpers = FileList('src', filter = '*libs*')
  deepcopy(helpers, Yak.build_root);


  # ================================
  # Standalone activity viewer
  # ================================

  # spitman = PH.getmanifest('spitfire', '0.1', istrunk)
  # bootman = PH.getmanifest('jsboot', '0.1', istrunk)
  # actlist = [
  #   spitman['spitfire-lab'],
  #   'src/onegateisopening/boot.js',
  # ]
  # combine(spitfireList, Yak.BUILD_ROOT + "/there.is.only.jsboot.js", replace=sed)




  # ================================
  # Versioned part of the app
  # ================================

  #js application
  js = FileList("src/app/common/helpers", filter = "*.js")
  js.merge(FileList("src/app/common/", filter = "*i18n.js"))
  js.merge(FileList("src/app/common/root", filter = "*.js"))
  js.merge(FileList("src/app/common/states", filter = "*.js"))
  js.merge(FileList("src/app/common/models", filter = "*.js"))
  js.merge(FileList("src/app/common/controllers", filter = "*.js"))
  js.merge(FileList("src/app/common/views", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/", filter = "*app.js"))
  # js.merge(FileList("src/app/desktop/states", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/models", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/controllers", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/views", filter = "*.js"))

  js.merge("src/activity/apiwrapper.js")
  js.merge("src/activity/activity.js")

  combine(js, VERSIONED_ROOT + "/lxxl.js", replace=sed)

  # js.merge(FileList("src/app/desktop/", filter = "*routing.js"))
  # js.merge(FileList("src/app/desktop/", filter = "*hotkeys.js"))
  # js.merge(FileList("src/app/desktop/model/", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/views/", filter = "*.js"))
  # js.merge(FileList("src/app/desktop/states/", filter = "*.js"))


  # css application
  css = FileList("src/assets/common/css", filter = "*.css,*.scss")
  css.merge("src/activity/activity.scss")
  # css.merge(FileList("src/assets/desktop/css", filter = "*.css,*.scss"))
  combine(css, VERSIONED_ROOT + "/lxxl.css", replace=sed)

  # fonts copy
  # fonts = FileList("src/assets/common/fonts/")
  # fonts.merge(FileList("src/assets/desktop/fonts/"))
  # deepcopy(fonts, VERSIONED_ROOT + '/fonts/')

  # images copy
  images = FileList('src/assets/common/images', filter = "*.jpg,*.png,*.gif,*.ico")
  # images.merge(FileList('src/assets/desktop/images', filter = "*.jpg,*.png,*.gif,*.ico"))
  deepcopy(images, VERSIONED_ROOT + "/images/")

  # templates merge
  templates = FileList('src/app/common/templates', filter = "*.tpl")
  # templates.merge(FileList("src/app/desktop/templates/", filter = "*.tpl"))
  combine(templates, VERSIONED_ROOT +  "/lxxl.tpl")


  # ================================
  # Versioned runner
  # ================================

  list = FileList('src', filter = '*activity*')
  deepcopy(list, VERSIONED_ROOT, replace=sed)
  
  # combine("src/activity/activity.tpl", VERSIONED_ROOT + "/activity.tpl", replace=sed)
  # css.merge(FileList("src/assets/desktop/css", filter = "*.css,*.scss"))
  combine("src/activity/activity.scss", VERSIONED_ROOT + "/activity/activity.css", replace=sed)

