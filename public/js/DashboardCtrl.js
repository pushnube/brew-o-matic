(function() {
    angular.module('dashboard', [])
        .controller(
            'DashboardCtrl',
            function(
                $scope,
                $rootScope,
                Recipe,
                Style,
                User,
                alertFactory,
                BrewHelper,
                Tag,
                TagColor
            ) {
                function createConfig(state,title,emptyText,show,showPanel) {
                    var config = {
                        title: title,
                        emptyText: emptyText,
                        showPanel: showPanel,
                        limit: 5,
                        state: state,
                        show: show,
                        noMore: false,
                        load: function() {
                            Recipe.query({
                                'filter[state]':state,
                                limit: this.limit,
                                sort:'-code'},
                                function(recipes) {
                                    config.noMore =  recipes.length < config.limit;
                                    config.items = recipes;
                                }
                            );
                        },
                        more: function() {
                            config.limit += 6;
                            config.load();
                        }
                    };
                    return config;
                }

                $scope.panels = ['running','ready','draft','finished','archived','wish'];
                $scope.configs = {
                    running: createConfig(
                        'running',
                        'En Curso',
                        'No tenes recetas en curso',
                        localStorage['home.running.show'] || true,
                        'Mostrar recetas en curso'
                    ),
                    ready: createConfig(
                        'ready',
                        'Listas',
                        'No tenes recetas listas',
                        localStorage['home.ready.show'] || true,
                        'Mostrar recetas listas'
                    ),
                    draft: createConfig(
                        'draft',
                        'Borradores',
                        'No tenes recetas en borrador',
                        localStorage['home.draft.show'] || true,
                        'Mostrar Borradores'
                    ),
                    finished: createConfig(
                        'finished',
                        'Finalizadas',
                        'No tenes recetas finalizadas',
                        localStorage['home.finished.show'] || false,
                        'Mostrar finalizadas'
                    ),
                    archived: createConfig(
                        'archived',
                        'Archivadas',
                        'No tenes recetas archivadas',
                        localStorage['home.archived.show'] || false,
                        'Mostrar archivadas'
                    ),
                    wish: createConfig(
                        'wish',
                        'Lista de deseos',
                        'No tenes recetas en lista de deseos',
                        localStorage['home.wish.show'] || false,
                        'Mostrar lista de deseos'
                    )
                };
                function reload() {
                    angular.forEach($scope.panels, function(key) {
                        $scope.configs[key].load();
                    });
                }

                $scope.convertColor = function(srm) {
                    return BrewHelper.convertColor(srm);
                };

                $scope.doDefault = function(recipe) {
                    if ( recipe.state === 'draft' ) {
                        recipe.$state({state:'ready'}, function() {
                            reload();
                        });
                    } else if ( recipe.state === 'ready' ) {
                        recipe.$state({state:'running'}, function() {
                            reload();
                        });
                    } else if ( recipe.state === 'running' ) {
                        recipe.$state({state:'finished'}, function() {
                            reload();
                        });
                    } else if ( recipe.state === 'finished' ) {
                        recipe.$state({state:'archived'}, function() {
                            reload();
                        });
                    } else if ( recipe.state === 'wish' ) {
                        recipe.$state({state:'draft'}, function() {
                            reload();
                        });
                    }
                };

                $scope.defaultActionName = function(recipe) {
                    if ( recipe.state === 'draft' ) {
                        return 'Esta Lista';
                    } else if ( recipe.state === 'ready' ) {
                        return 'Comenzar';
                    } else if ( recipe.state === 'running' ) {
                        return 'Finalizar';
                    } else if ( recipe.state === 'finished' ) {
                        return 'Archivar';
                    } else if ( recipe.state === 'wish' ) {
                        return 'Recuperar';
                    }
                };

                $scope.show = function(panel) {
                    panel.show = true;
                    localStorage['home.' + panel.state + '.show'] = true;
                };

                $scope.hide = function(panel) {
                    panel.show = false;
                    localStorage['home.' + panel.state + '.show'] = false;
                };

                $rootScope.breadcrumbs = [{
                    link: '#',
                    title: 'Inicio'
                }];
                $rootScope.$watch('user',function(user) {
                    if ( user ) {
                        // $scope.recipes = Recipe.query();
                        $scope.stats = Recipe.stats();
                        reload();
                    }
                });
            }
        );

})();