import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './views/base';

/**Global State view of the app
 * -Search object
 * -Current recipe object
 * -Shopping list object
 * -Liked recipes
 */
const state = {};

/** Search Controller */
const controlSearch = async () => {

    //1. Get query from view
    const query = searchView.getInput();
    
    if (query) {
        //2. New search object & Save to state
        state.search = new Search(query);

        //3. Prepare ui for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //4. Search for recipes
            await state.search.getResults();
            //console.log(state);
            //5.render res on ui
            //console.log(state.search.result);
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err){
            alert('Error with search');
            clearLoader();
        }
        
    } 
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

//testing
/*window.addEventListener('load', e => {
    e.preventDefault();
    controlSearch();
});*/

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    //console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage,);
        //console.log(goToPage);
    }
});

/** Recipe Controller */

const controlRecipe = async () => {
    //Get id form url
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if(id) {
        //prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        
        //Highlight selected area item
        if (state.search) searchView.highlightSelected(id);

        // create new recipe obj
        state.recipe = new Recipe(id);
        
        //testing
        //window.r = state.recipe;

        try {
            //get recipe data
            await state.recipe.getRecipe();
            //console.log(state.recipe.ingredients);
            state.recipe.parseIngredients();

            //calc servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //render recipe
            //console.log(state.recipe);
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id));
            
        } catch (err) {
            alert('Error processing recipe');
        }
        
    }
}

//window.addEventListener('hashchange', controlRecipe);
['hashchange', 'load'].forEach(e => window.addEventListener(e, controlRecipe));


const controlList = () => {
    //Create anew list if there is none yet
    if(!state.list) state.list = new List();

    //Add each ingredient to the list and ui
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}


//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);
        
        //Delete from the ui
        listView.deleteItem(id);

    } else if(e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not yet liked curent recipe
    if(!state.likes.isLiked(currentID)) {
        //Add the like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );
        //toggle the like button
        likesView.toggleLikeBtn(true);

        //add like to ui list
        likesView.renderLike(newLike);
        //console.log(state.likes);
    
    //User has liked curent recipe
    } else {
        //Remove the like to the state
        state.likes.deleteLike(currentID);
        //toggle the like button
        likesView.toggleLikeBtn(false);


        //remove like from ui list
        likesView.deleteLike(currentID);
        //console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page laod
window.addEventListener('load', () => {
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();
    
    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //like controller
        controlLike();
    }
});