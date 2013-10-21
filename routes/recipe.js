var actions = require('./actions.js');
var model = require('../domain/model.js');
var Arrays = require('../public/js/util/util.js').Arrays;

exports.findPublic = function (req, res) {
    model.Recipe.find({isPublic:true}).where('owner').populate('owner').ne(req.session.user_id).sort('-date').limit(req.query.limit).exec(function(err,results) {
        res.send(results);
    });
};

exports.findAll = function(req, res) {
    model.Recipe.find({owner:req.session.user_id}).sort('-date').exec(function(err,results) {
        res.send(results);
    });    
};

exports.get = function(req, res) {
    model.Recipe.findOne({_id:req.params.id}).populate('owner').exec(function(err,results) {
        res.send(results);
    });    
};

exports.remove= function(req, res) {
    model.Recipe.findByIdAndRemove(req.params.id,function(err,results) {
        res.send(results);
        actions.log(req.session.user_id, "REMOVE_RECIPE","NAME: '"+results.NAME+"'. recipe_id: "+results._id);
    });    
};


function generateId(name,user_id) {
    return name.replace(/ /g, "_")
                .replace(/#/g,"_Nro_")
                .replace(/%/g,"_Per_")
                + "-" + user_id + "-" + (new Date()).getTime();
}

exports.addComment = function(req,res) {
    model.Recipe.findOne({_id:req.body.recipe_id}).exec(function(err,recipe) {
        recipe.comments.push({
            _id: req.session.user_id + "_" + new Date().getTime(),
            user_id: req.session.user_id,
            name: req.session.user_name,
            text: req.body.text,
            date: new Date()
        });
        recipe.save();
        res.send(recipe.comments);
        actions.log(req.session.user_id, "ADD_COMMENT","NAME: '"+recipe.NAME+"'. recipe_id: "+recipe._id);
    });
};

exports.deleteComment = function(req,res) {
    model.Recipe.findOne({_id:req.body.recipe_id}).exec(function(err,recipe) {
        Arrays.remove(recipe.comments,req.body.comment,function(comment,iter){
            return comment._id == iter._id ? 0 : -1;
        });
        recipe.save();
        res.send(recipe.comments);
        actions.log(req.session.user_id, "REMOVE_COMMENT","NAME: '"+recipe.NAME+"'. recipe_id: "+recipe._id);
    });
};

exports.save = function(req, res) {
    
    function callback(err,s){
        if (err) {
            console.log("error", err);
        }
//        console.log("response bottling",s.bottling);
        res.send(s);
    }
    
    if (!req.body._id) {
        var recipe = new model.Recipe(req.body);
        var id = generateId(req.body.NAME,req.session.user_id);
        recipe._id = id;
        recipe.owner = req.session.user_id;
        recipe.save(callback);
        
        /**
         * Si la estoy clonando de otra, debo hacerle update para
         * poner que fue clonada por mi.
         */
        if (recipe.cloneFrom ) {
            model.Recipe.findOne({_id:recipe.cloneFrom}).exec(function(err,recipe){
                recipe.clonedBy.push({
                    _id: req.session.user_id,
                    name: req.session.user_name,
                    recipe_id: id
                });
                recipe.save();
            });
        }
        actions.log(req.session.user_id, "ADD_RECIPE","NAME: '"+req.body.NAME+"'. recipe_id: "+id);
    } else {
        console.log("FERMENTABLES",req.body.FERMENTABLES);
        console.log("bottling",req.body.bottling);
        var id = req.body._id;
        delete req.body._id;
        req.body.owner = req.body.owner._id;
        req.body.modificationDate = new Date();
        //console.log("UPDATE POST", req.body);
        model.Recipe.findByIdAndUpdate(id,req.body).populate('owner').exec(callback);
        actions.log(req.session.user_id, "UPDATE_RECIPE","NAME: '"+req.body.NAME+"'. recipe_id: "+id);
    }
    
};

exports.publish = function(req, res) {
    model.Recipe.findOne({_id:req.params.id}).populate('owner').exec(function(err,recipe) {
        recipe.isPublic = req.query.isPublic;
        recipe.save(function(err) {
            if ( err ) {
                res.send(500,{error: 'Error al publicar la receta'});
            } else {
                res.send(recipe);
            }
        });
    });
};