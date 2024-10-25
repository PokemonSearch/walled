import logo from './logo.svg';
import './App.css';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import {Text} from 'react-native';
import {Dex} from '@pkmn/dex';
import {Generations} from '@pkmn/data';
import {Smogon} from '@pkmn/smogon';
import * as SmogCalc from '@smogon/calc';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { Move } from '@smogon/calc/dist/move';

var SCORE = 0;
var SCORE_STORAGE = 0;

const fetch = window.fetch.bind(window);
const gens = new Generations(Dex);
const smogonGen = SmogCalc.Generations.get(9);
const smogon = new Smogon(fetch);
const var_options = {
  shouldForwardProp: (prop) => prop !== 'fontColor',
};
const StyledTextField = styled(
  TextField,
  var_options,
)(({ fontColor }) => ({
  input: {
    color: fontColor,
  },
}));
var allMoves = Object.keys(gens.dex.data.Moves);
var allAbilities = Object.keys(gens.dex.data.Abilities);
var flagList = []
var ability_flagList = []
for(var i = 0; i < allMoves.length; i++)
{
  flagList = Array.prototype.concat(flagList, Object.keys(gens.dex.data.Moves[allMoves[i]].flags));
}
for(var i = 0; i < allAbilities.length; i++)
{
  ability_flagList = Array.prototype.concat(ability_flagList, Object.keys(gens.dex.data.Abilities[allAbilities[i]].flags));
}
flagList = [... new Set(flagList)];
ability_flagList = [... new Set(ability_flagList)];
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));
var statPoints = [1];
for(var i = 10; i <= 150; i += 10)
{
  statPoints.push(i);
}
var pokeCalcs = []
var pokemonTypes = [
  "none",
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
]
var bannedAbilities = ["Wonder Guard"]
var bannedItems = []
var pokemonTypes_withoutNone = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
]
var activatePanel = true;
var typeColours = {
  'normal': '#ABAB9B',
  'fire': '#FF4422',
  'water': '#3399FF',
  'electric': '#FFCC33',
  'grass': '#77CC55',
  'ice': '#66CCFF',
  'fighting': '#BB5544',
  'poison': '#AA5599',
  'ground': '#DDBB55',
  'flying': '#8899FF',
  'psychic': '#FF5599',
  'bug': '#AABB22',
  'rock': '#BBAA66',
  'ghost': '#6666BB',
  'dragon': '#7766EE',
  'dark': '#775544',
  'steel': '#AAAABB',
  'fairy': '#EE99EE',
  'none': "#2F2E2E"
}
const MAX_ID = 1025;
var MAX_BST = 520;
var min_types = 1
var fetchHeader = "https://raw.githubusercontent.com/PokemonSearch/pokemonsearch.github.io/jsdex-light/public/";
window.global = window;
const queryString = window.location.search.split("?");
var searchString = ""
if(queryString.length > 1)
{
  searchString = queryString[1];
}
var loadedID = -1;
var preloadedID = -1;
var data = [];
var preloaded_data = []
var designedPokemon;
resetDesignedMon();
var immuneFactors = 
{
  typing: 0,
  abilities: 0,
  items: 0,
  canUseItem: 0,
  multiple: 0,
  immuneTypes: []
}
var randomized = false;
var countingDown = false;
var displayingResults = false;
var MAXTIME = 20;
var timer = MAXTIME;
var foundMon = false;
var requirementRand = 0;

function hasCommonElement(arr1, arr2)
{
  for(var i = 0; i < arr1.length; i++)
  {
    for(var j = 0; j < arr2.length; j++)
    {
      if(arr1[i] == arr2[j])
      {
        return true;
      }
    }
  }
  return false;
}

function addToDictArr(dict, key, value)
{
  if(!Object.keys(dict).includes(key)){dict[key] = []}
  if(!dict[key].includes(value)){dict[key].push(value)}
}

function ext_nameToCompName(name, base = false)
{
  
  if(name.toLowerCase().startsWith("ogerpon"))
  {
    return name.replaceAll("-mask","");
  }

  if(name.toLowerCase().startsWith("tauros-paldea"))
  {
    return name.replaceAll("-breed", ""); 
  }

  if(name.toLowerCase().startsWith("necrozma-"))
  {
    return name.replaceAll("-mane", ""); 
  }

  
  return name;
}

function addImmuneFactor(obj)
{
  immuneFactors.typing += obj.typing;
  immuneFactors.abilities += obj.abilities;
  immuneFactors.items += obj.items;
  immuneFactors.canUseItem += obj.canUseItem;
  immuneFactors.multiple += obj.multiple;
}

function resetDesignedMon()
{
  designedPokemon = {
    type1: "normal",
    type2: "none",
    ability: "none",
    item: "none",
    stats: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0}
  }
}

class MainComp extends React.Component {

    constructor(props) {
      super(props);
      this.randomSet = false;
      this.checkingForReset = false;
  }

  async checkForRandomReset()
  {
    if(this.checkingForReset){return;}
    this.checkingForReset = true;
    while(this.randomSet == randomized)
    {
      await new Promise(r => setTimeout(r, 1)); 
    }
    this.randomSet = randomized;
    this.checkingForReset = false;
    this.forceUpdate();
  }

  async randomizePokemon()
  {
    if(preloadedID > 0)
    {
      await new Promise(r => setTimeout(r, 500)); 
      loadedID = -1;
      while(!foundMon)
      {
        await new Promise(r => setTimeout(r, 1)); 
      }
      loadedID = preloadedID;
      preloadedID = -1;
      this.forceUpdate();
      this.pre_randomizePokemon();
    }
    else
    {
      var newID = Math.round(Math.random()*(MAX_ID - 1) + 1);
      this.loadDexEntry(newID);
    }
  }

  async pre_randomizePokemon()
  {
    var newID = Math.round(Math.random()*(MAX_ID - 1) + 1);
    this.loadDexEntry(newID, true);
  }

  nameToCompName(name, base = false)
  {
    
    return ext_nameToCompName(name, base);
  }

  async loadDexEntry(id, preloading = false)
  {
    if(preloading)
    {
      preloadedID = id;
      await this.loadData(preloadedID, true);
    }
    else
    {
      loadedID = id;
      await this.loadData(loadedID, false);
    }
    
    
  }

  validPokemon(mon)
  {
    if(Object.keys(mon.abilities).includes("Mold Breaker"))
    {
      return false;
    }
    return true;
  }

  getFinalEvo(evo_chain)
  {
    var ev = evo_chain.chain;
    while(ev.evolves_to.length > 0)
    {
      ev = ev.evolves_to[0];
    }
    return ev.species.name;
  }

  flagImmunity(move_str)
  {
    var move = gens.dex.moves.get(move_str);
    var flags = Object.keys(move.flags);
    var immuneFlags = ["bullet","wind","sound"];
    
    for(var i = 0; i < immuneFlags.length; i++)
    {
      if(flags.includes(immuneFlags[i])){return true}
    }

    return false;
  }
  canBeImmune(move_str)
  {
    var move = gens.dex.moves.get(move_str);
    if(move.category == "Status"){return true;}
    if(move.ignoreImmunity){return false;}
    if(move.priority > 0){return true;}
    if(this.flagImmunity(move)){return true;}
    if(["Ice","Dark","Flying","Bug","Rock","Steel", "Fairy"].includes(move.type)){return false;}
    return true;
  }

  processImmResults(obj)
  {
    obj.canUseItem = obj.items;
    if(Math.max(obj.typing, obj.abilities, obj.items) < obj.typing + obj.abilities + obj.items)
    {
      obj = {typing: 0, abilities: 0, items: 0, canUseItem: obj.canUseItem, multiple: 1};
    }
    if(obj.typing > 1)
    {
      obj.typing = 1
    }
    if(obj.abilities > 1)
    {
      obj.abilities = 1
    }
    if(obj.items > 1)
    {
      obj.abilities = 1
    }
    if(obj.canUseItem > 1)
    {
      obj.canUseItem = 1;
    }
    return obj;
  }

  flagMoves(dict, move_str)
  {
    var move = gens.dex.moves.get(move_str);
    
    if(["Ground"].includes(move.type)){addToDictArr(dict, move_str, "item")}
    if(["Fire", "Water", "Grass", "Electric", "Ground"].includes(move.type) || this.flagImmunity(move_str) || move.priority > 0){addToDictArr(dict, move_str, "ability")}
    if(["Normal", "Electric", "Fighting", "Poison", "Ground", "Psychic", "Ghost", "Dragon"].includes(move.type)){addToDictArr(dict, move_str, "typing: " + move.type.toLowerCase())}
  }

  getImmuneAbility(move_str)
  {
    var abilities = []
    var move = gens.dex.moves.get(move_str);
    if(move.type == "Fire")
    {
      abilities.push("Flash Fire");
    }
    if(move.type == "Water")
    {
      abilities.push("Water Absorb");
      abilities.push("Storm Drain");
    }
    if(move.type == "Grass")
    {
      abilities.push("Sap Sipper");
    }
    if(move.type == "Electric")
    {
      abilities.push("Volt Absorb");
      abilities.push("Motor Drive");
    }
    if(move.type == "Ground")
    {
      abilities.push("Levitate");
    }
    if(move.flags.bullet)
    {
      abilities.push("Bulletproof");
    }
    if(move.flags.sound)
    {
      abilities.push("Soundproof");
    }
    if(move.flags.wind)
    {
      abilities.push("Wind Rider");
    }
    if(move.priority > 0)
    {
      abilities.push("Armor Tail");
    }
    return abilities;
  }

  checkPossible(dict)
  {
    var moves = Object.keys(dict);
    var type_dict = {}
    for(var i = 0; i < pokemonTypes.length; i++)
    {
      type_dict["typing: " + pokemonTypes[i]] = 0;
    }
    var used_abliities = []
    var unique_types = 0
    var abl = 0
    var itm = 0
    moves.sort((a, b) => {return (dict[b].length - dict[a].length)})
    moves.sort((a, b) => {return ((gens.dex.moves.get(a).type.toLowerCase() == "ground" ? 1 : 0) - (gens.dex.moves.get(b).type.toLowerCase() == "ground" ? 1 : 0))})
    for(var i = 0; i < moves.length; i++)
    {
      var move = moves[i];
      if(gens.dex.moves.get(move).category == "Status"){continue;}
      var type = gens.dex.moves.get(move).type.toLowerCase();
      var flags = dict[move];
      if(flags.length == 0){continue;}
      var done = false;
      //check for typing
      for(var f = 0; f < flags.length; f++)
      {
        var flag = flags[f];
        if(!flag.startsWith("typing:")){continue;}
        if(type_dict[flag] == 0 && unique_types < 2)
        {
          unique_types++;
          type_dict[flag] = 1;
          done = true;
        }
        if(type_dict[flag] == 1)
        {
          done = true;
        }
      }

      if(done){continue;}
      console.log("flags for",move,flags);
      //check for ability/moves
      if(flags.includes("item"))
      {
        console.log("item for",move);
      }
      if(flags.includes("ability"))
      {
        var required_abilities = this.getImmuneAbility(move);
        if(abl == 0)
        {
          used_abliities = Array.prototype.concat(used_abliities, required_abilities);
          abl++;
          console.log("ability for",move);
          continue;
        }
        if(hasCommonElement(required_abilities, used_abliities))
        {
          continue;
        }
        if(abl > 0 && itm <= 0 && flags.includes("item"))
        {
          itm++;
          continue;
        }
        if(!flag.includes("item"))
        {
          return [false, 0, 0];
        }
      }
      if(flags.includes("item"))
      {
        if(type_dict["typing: ground"] == 1){continue;}
        if(itm <= 0)
        {
          itm++;
          continue;
        }
        return [false, 0, 0];
      }
      return [false, 0, 0];
    }
    if(abl > 1){return [false, 0, 0];}
    if(itm > 1){return [false, 0, 0];}
    if(unique_types > 2){return [false, 0, 0];}
    return [true, abl, itm];
  }

  processImmunities(move_str)
  {
    
    var obj = {typing: 0, abilities: 0, items: 0, canUseItem: 0, multiple: 0}
    var move = gens.dex.moves.get(move_str);
    if(move.category == "Status"){return obj;}
    var flags = Object.keys(move.flags);
    if(["Ground"].includes(move.type)){obj.items += 1}
    if(["Fire", "Water", "Grass", "Electric", "Ground"].includes(move.type)){obj.abilities += 1}
    if(["Normal", "Electric", "Fighting", "Poison", "Ground", "Psychic", "Ghost", "Dragon"].includes(move.type)){obj.typing += 1}
    
    if(this.flagImmunity(move_str)){obj.abilities += 1}
    if(move.priority > 0){obj.abilities += 1;}
        
    return this.processImmResults(obj);
  }

  processAbilities(ability_str)
  {
    
    var obj = {typing: 0, abilities: 0, items: 0, canUseItem: 0, multiple: 0}
    var ability = gens.dex.abilities.get(ability_str);
    if(["mold breaker", "teravolt", "turboblaze"].includes(ability.name.toLowerCase())){obj.items += 1;}
        
    return this.processImmResults(obj);
  }

  addImmuneTyping(move_str)
  {
    var move = gens.dex.moves.get(move_str);
    var typing = move.type;
    if(move.category == "Status"){return;}
    var macthups = gens.dex.types.get(typing);
    var typelist = Object.keys(macthups.damageTaken);
    var immTypes = []
    for(var i = 0; i < typelist.length; i++)
    {
      var opTypeMatchup = gens.dex.types.get(typelist[i]);
      if(opTypeMatchup.damageTaken[typing] == 3)
      {
        var toAdd = true;
        for(var x1 = 0; x1 < immuneFactors.immuneTypes.length; x1++)
        {
          var arr = immuneFactors.immuneTypes[x1];
          for(var x2 = 0; x2 < arr.length; arr++)
          {
            if(arr[x2] == typelist[i])
            {
              toAdd = false;
              break;
            }
          }
        }
        if(toAdd){immTypes.push(typelist[i])};
      }
    }

    if(immTypes.length > 0)
    {
      immuneFactors.immuneTypes.push(immTypes);
    }
    
    
  }

  async loadData(i, preloading = false)
  {
    foundMon = false;
    immuneFactors = 
    {
      typing: 0,
      abilities: 0,
      items: 0,
      canUseItem: 0,
      multiple: 0,
      immuneTypes: []
    }
    var api_data = await fetch(fetchHeader+"data/api/"+i+"/api.json").then((response) => response.json());
    var evo_data = await fetch(fetchHeader+"data/api/"+i+"/evo.json").then((response) => response.json());
    var compdata = await smogon.stats(gens.get(9), this.nameToCompName(api_data.name));
    var finalEvo = this.getFinalEvo(evo_data);
    var isFinal = api_data.name != finalEvo;
    while(compdata == null || !this.validPokemon(compdata))
    {
      i++;
      if(preloading){preloadedID++}else{loadedID++};
      api_data = await fetch(fetchHeader+"data/api/"+i+"/api.json").then((response) => response.json());
      compdata = await smogon.stats(gens.get(9), this.nameToCompName(api_data.name));
      evo_data = await fetch(fetchHeader+"data/api/"+i+"/evo.json").then((response) => response.json());
      finalEvo = this.getFinalEvo(evo_data);
    }

    var spec_data = await fetch(fetchHeader+"data/api/"+i+"/species.json").then((response) => response.json());
    
    var sprite_path = fetchHeader+"data/sprites/"+i+"/front_default.png";
    var moveList = [];
    var added = [];
    var compMoves = Object.keys(compdata.moves);
    var compMove_list = Object.keys(compdata.moves);
    var compAbilities = Object.keys(compdata.abilities);
    var moveDict = {}
    var usedTypes = []
    while(compMove_list.length > 0 && moveList.length < 4)
    {
      var x = Math.round(Math.random()*(compMove_list.length - 1));
      var newMove = compMoves[x];
      compMove_list.splice(x, 1);
      if(newMove.toLowerCase() != "nothing" && !added.includes(newMove) && gens.dex.moves.get(newMove).category != "Status" && this.canBeImmune(newMove) && gens.dex.moves.get(newMove).type.toLowerCase() != "normal")
      {
        var type = gens.dex.moves.get(newMove).type;
        if(usedTypes.includes(type))
        {
          continue;
        }
        usedTypes.push(type);
        var moveproc = this.processImmunities(newMove);
        addImmuneFactor(moveproc);
        this.addImmuneTyping(newMove);
        moveList.push([newMove, moveList.length]);
        this.flagMoves(moveDict, newMove);
        added.push(newMove);
      }
      
    }
    var compMove_list = Object.keys(compdata.moves);
    while(compMove_list.length > 0 && moveList.length < 4)
    {
      var x = Math.round(Math.random()*(compMove_list.length - 1));
      var newMove = compMoves[x];
      compMove_list.splice(x, 1);
      if(newMove.toLowerCase() != "nothing" && this.canBeImmune(newMove) && gens.dex.moves.get(newMove).type.toLowerCase() != "normal" && !added.includes(newMove))
      {
        var type = gens.dex.moves.get(newMove).type;
        if(usedTypes.includes(type))
        {
          continue;
        }
        usedTypes.push(type);
        var moveproc = this.processImmunities(newMove);
        addImmuneFactor(moveproc);
        this.addImmuneTyping(newMove);
        moveList.push([newMove, moveList.length]);
        this.flagMoves(moveDict, newMove);
        added.push(newMove);
      }
      
    }

    for(var x = 0; x < compMoves.length; x++)
    {
      if(moveList.length == 4){break;}
      var newMove = compMoves[x];
      if(newMove.toLowerCase() != "nothing" && this.canBeImmune(newMove) && !added.includes(newMove))
      {
        moveList.push([newMove, x]);
        added.push(newMove);
        this.flagMoves(moveDict, newMove);
      }
    }
    var ability_obj = {items: 0, typing: 0, abilities: 0, canUseItem: 0, multiple: 0};
    var usedAbility = compAbilities[0];
    for(var x = 0; x < compAbilities.length; x++)
    {
      var newAbility = compAbilities[x];
      var abl_ob = this.processAbilities(newAbility);
      if(abl_ob.canUseItem + abl_ob.abilities > ability_obj.canUseItem + abl_ob.abilities)
      {
        usedAbility = newAbility;
        ability_obj = abl_ob;
      }
    }
    addImmuneFactor(ability_obj);
    
    console.log(Object.keys(moveDict),added);
    var taglist = this.checkPossible(moveDict);
    var possible = taglist[0];
    
    
    if(immuneFactors.immuneTypes.length < min_types || (requirementRand <= 0.3 && min_types != 1 && taglist[2] == 0) || (requirementRand > 0.3 && min_types != 1 && taglist[1] == 0))
    {
      possible = false;
    }
    if(possible)
    {
      console.log(Object.keys(moveDict), taglist);
      foundMon = true;
      var returnData = {spec: spec_data, api: api_data, img: sprite_path, compdata: compdata, moves: moveList, ability: usedAbility}
      data[i.toString()] = returnData;
      min_types = 2
      if(preloading == false && preloadedID < 0)
      {
        this.pre_randomizePokemon();
      }
      
      if(!preloading)
      {
        this.forceUpdate();
      }
    }
    else
    {
      if(preloading)
      {
        this.pre_randomizePokemon();
      }
      else
      {
        this.randomizePokemon();
      }
      
    }
    
  }

  render()
  {
    this.checkForRandomReset();
    var dexJSX = (<p/>)
    if(loadedID > 0 && data[loadedID] != null)
    {
      dexJSX = (<div  className='poke-reveal' style={{zIndex:"100", objectPosition:"right top", position: "fixed", width: "90%", height: "5vw", display: "grid", justifySelf: "center", alignSelf: "center", gridAutoFlow: "column", top:"10%", alignItems:"center", alignContent: "center", justifyContent: "center"}}>
        <div style={{display:"grid", gridAutoFlow:'column', width: "100%", height: "100%",  gridTemplateColumns: "1fr 2fr"}}>
          <div style={{display:"block"}}>
            <img className='poke-image' src={data[loadedID].img} style={{imageRendering: "pixelated", width: "100%"}}/>
            <div className='text-reveal'><Text style={{fontWeight: "bold", fontSize: "1em", left:"0%", justifySelf: "center"}}>{subTitleCase(splitTitleCase(data[loadedID].ability))}</Text></div>
          </div>
          <div style={{display: "grid", alignContent: "center", justifyContent:"center", textAlign: "center", width: "100%", gridAutoFlow: "row", gridTemplateColumns: "1fr 1fr", columnGap: "9.5%", rowGap: "0.2%"}}>
            {data[loadedID].moves.map(movedata => 
            <div className='move-reveal' style={{width: "100%", animationDelay: (0.5 + 0.1*movedata[1]).toString() + "s"}}>
              <Item style={{width:"100%", height: "50%", justifyContent:"center", alignContent: "center", backgroundColor: (typeColours[gens.dex.moves.get(movedata[0]).type.toLowerCase()])}}>
                <Text style={{color: "white", fontSize: "1em", textAlign: "center"}}>{subTitleCase(movedata[0], "-")}</Text>
              </Item>
              </div>)}
            
          </div>
        </div>
        
        </div>)
    }
    
    if(!randomized)
    {
      randomized = true;
      this.randomizePokemon();
    }

    return(
      <div className="App" style={{display:"grid"}}>
        {dexJSX}
      </div>
    )
  }
}

class PokemonCreator extends React.Component
{
  constructor(props) {
    super(props);
  }

  async waitForIDChange()
  {
    var oldID = loadedID;
    while(loadedID <= 0 || loadedID == oldID || data[loadedID] == null)
    {
      await new Promise(r => setTimeout(r, 1)); 
    }
    this.forceUpdate();
  }

  async startTimer()
  {
    if(countingDown){return;}
    if(timer == 0 && randomized)
    {
      timer = MAXTIME;
      randomized = false;
      requirementRand = 1 + 0.6*Math.random();
      loadedID = -1;
      return;
    }
    
    countingDown = true;
    activatePanel = true;
    SCORE = SCORE_STORAGE;
    
    MAXTIME = Math.max(20 - 1*SCORE, 15);
    timer = MAXTIME;
    pokeCalcs = [];
    
    this.forceUpdate();
    resetDesignedMon();
    await new Promise(r => setTimeout(r, 1500)); 
    while(timer > 0)
    {
      await new Promise(r => setTimeout(r, 500)); 
      timer -= 0.5;
      this.forceUpdate();
    }
    await new Promise(r => setTimeout(r, 200)); 
    activatePanel = false;
    this.generateCalcs(loadedID);
    this.checkCalcs(pokeCalcs);
    this.forceUpdate();
    await new Promise(r => setTimeout(r, 5000)); 
    countingDown = false;
    this.forceUpdate();
  }

  checkCalcs(calcList)
  {
    var failed = false;
    for(var i = 0; i < calcList.length; i++)
    {
      if(calcList[i].dmg != 0)
      {
        failed = true;
        break;
      }
    }
    if(failed)
    {
      SCORE_STORAGE = 0;
    }
    else
    {
      SCORE_STORAGE = SCORE + 1;
    }
    this.forceUpdate();
  }

  generateCalcs(id)
  {
    try
    {
      for(var i = 0; i < data[id].moves.length; i++)
      {
        var createdSet =  new SmogCalc.Pokemon(smogonGen, 'Ditto', {
          item: subTitleCase(designedPokemon.item),
          nature: 'Serious',
          ability: subTitleCase(designedPokemon.ability),
          evs: {},
          boosts: {},
        });
        createdSet.types = [subTitleCase(designedPokemon.type1)];
        if(designedPokemon.type2 != "none"){createdSet.types.push(subTitleCase(designedPokemon.type2));}
        createdSet.species.types = createdSet.types;
        createdSet.species.baseStats = designedPokemon.stats;
        var move = gens.dex.moves.get(data[id].moves[i][0]);
        var moveName = data[id].moves[i][0];
        console.log(ext_nameToCompName(data[id].api.name));
        var attacker = new SmogCalc.Pokemon(smogonGen, ext_nameToCompName(data[id].api.name));
        attacker.ability = data[id].ability;
        createdSet.name = "Custom Pokemon";
        console.log("created mon:",createdSet, createdSet.species);
        //createdSet.species = null;
        var dmgCalc = SmogCalc.calculate(smogonGen, attacker, createdSet, new Move(smogonGen, moveName));
        console.log("calc:",dmgCalc);
        var dmg = 0;
        if(dmgCalc.damage != 0)
        {
          dmg = dmgCalc.damage[0];
        }
        var perc = 100*dmg/createdSet.rawStats.hp;
        var obj = {move: move, numID: i, dmg: dmg, perc: perc.toFixed(0)};
        pokeCalcs.push(obj);
      }
      
      this.forceUpdate();
    }
    catch
    {

    }
  }

  setMonAttribute(attr, val)
  {
    designedPokemon[attr] = val;
    this.forceUpdate();
  }

  render()
  {
    this.waitForIDChange();
    
    var urgentText = "Loading...";
    if(loadedID > 0 && data[loadedID] != null)
    {
      urgentText = "Create a Pokemon that walls " + splitTitleCase(data[loadedID].api.name) + "!";
      this.startTimer();
    }
    if(loadedID <= 0 || data[loadedID] == null)
    {
      return (<div style={{position: "fixed", width: "100%", height: "100%", display: "grid", justifySelf: "center", alignSelf: "center", alignItems:"center", alignContent: "center", justifyContent: "center", textAlign:"center"}}>
        <div><CircularProgress /></div>
        <Text style={{textAlign:"center"}}>Generating Pokemon</Text>
      </div>)
    }
    var mon_bst = 0;
    for(var i = 0; i < 6; i++)
    {
      mon_bst += data[loadedID].api.stats[i].base_stat;
    }
    MAX_BST = mon_bst;
    var typeSearch = []
    var typeSearch_removeNone = []
    var abilitySearch = []
    var abilityKeys = Object.keys(gens.dex.data.Abilities);
    var itemSearch = []
    var itemKeys = Object.keys(gens.dex.data.Items);
    for(var i = 0; i < pokemonTypes.length; i++)
    {
      var t = pokemonTypes[i];
      var searchObj = {
        label: titleCase(t),
        color: typeColours[t]
      }
      typeSearch.push(searchObj)
      if(t != "none")
      {
        typeSearch_removeNone.push(searchObj);
      }
    }
    for(var i = 0; i < abilityKeys.length; i++)
    {
      var abl = abilityKeys[i];
      var obj = {label: gens.dex.data.Abilities[abl].name}
      if(obj.label != "No Ability" && !(bannedAbilities.includes(obj.label)))
      {
        abilitySearch.push(obj);
      }
    }
    for(var i = 0; i < itemKeys.length; i++)
    {
      var itm = itemKeys[i];
      var obj = {label: gens.dex.data.Items[itm].name}
      if(!(bannedItems.includes(obj.label)))
      {
        itemSearch.push(obj);
      }
    }
    var dropdownSearch = (<Select style={{maxHeight:"100px"}}>
    {pokemonTypes_withoutNone.map(t => 
      <MenuItem value={t}><Text style={{color:typeColours[t]}}>{titleCase(t)}</Text></MenuItem>
    )}</Select>)
    var arr_list = [{arr: typeSearch_removeNone, num: 1}, {arr: typeSearch, num: 2}]
    var arr2_list = [{arr: abilitySearch, name: "Ability"},{arr: itemSearch, name: "Item"}]

    var raw_statArr = statPoints;
    var statArr = [];
    var statColour = {};
    var statNames = Object.keys(designedPokemon.stats);
    var bst = arrSum(Object.values(designedPokemon.stats));
    for(var i = 0; i < raw_statArr.length; i++)
    {
      var stat = raw_statArr[i];
      if(bst + stat <= MAX_BST)
      {
        var statObj = {label:stat.toString(), value:stat}
        statArr.push(statObj);
        if(stat < 70)
        {
          statColour[stat] = "#FF5349";
        }
        else if(stat < 100)
        {
          statColour[stat] = "#FFA500";
        }
        else if(stat < 130)
        {
          statColour[stat] = "#006400";
        }
        else
        {
          statColour[stat] = "#008B8B";
        }
      }
    }

    return (
    <div style={{width:"100%"}}>
    <div className='score-text' style={{position:"fixed", textAlign:"center", top:"0vh", alignSelf: "center", justifySelf:"center",width:"100%"}}><Text style={{fontSize:"5vh", fontWeight:"bold"}}>{SCORE}</Text></div>
    <div className={activatePanel ? 'creation-panel' : 'creation-panel-close'} 
    style={{opacity:0, position: "fixed", width: "100%", display: "grid", justifySelf: "center", alignSelf: "center", gridAutoFlow: "row", height: "100vh", top:"calc(10%)", 
    alignItems:"center", alignContent: "center", justifyContent: "center", justifyItems:"center", backgroundColor:"100%", gridTemplateColumns: "0.8fr"}}>
      <div style={{width:"100%", justifySelf: "center"}}>
        <Item style={{alignSelf:"center", justifySelf:"center"}}>
          <Text>{urgentText}</Text>
        </Item>
        <div style={{textAlign:"center", width:"100%", justifySelf:"center"}}>
          <br/>
          <CircularProgress variant="determinate" value={100*timer/MAXTIME} size={"100px"} />
          <Box
          sx={{
            top: "0",
            left: 0,
            bottom: "350px",
            right: 0,
            position: "absolute",
            display: 'grid',
            alignItems: 'center',
            alignSelf: 'center',
            justifySelf: 'center',
            justifyContent: 'center',
          }}>
            <Typography
            variant="caption"
            component="div"
            color="black"
            fontSize={"2em"}
            fontWeight={"bold"}
          >{`${Math.round(Math.ceil(timer))}`}</Typography>
        </Box>

        </div>
      </div>
      <br/>
      <div style={{display:"grid",gridAutoFlow:"column", width:"100%"}}>
      {arr_list.map(op =>
          <Autocomplete
          style={{display:"inline"}}
          disablePortal
          id={"type-search-"+op.num}
          options={op.arr}
          onInputChange={(event, value) => {designedPokemon["type"+op.num] = value.toLowerCase()}}
          getOptionLabel={(option) => option.label}
          defaultValue={op.arr[0]}
          renderOption={(props, option) => {
            return (
              <span {...props} style={{}}>
                <Text style={{ color: option.color }}>{option.label + "  "}</Text>
                <nobr/>
                <img src={"typeicons/color_"+option.label.toLowerCase()+".png"} height={"20px"}></img>
              </span>
            );
          }}
          renderInput={(params) => {
            return (
              <div>
              <StyledTextField
                {...params}
                fontColor={(typeColours[designedPokemon["type"+op.num].toLowerCase()])}
                label={"Type " + op.num}
                variant="outlined"
                fullWidth
              ></StyledTextField>
              </div>
            );
          }}
        />
      )}
      </div>
      <br/>
      <div style={{width:"100%", display:"grid",gridAutoFlow:"row"}}>
      {arr2_list.map(op =>
        <div><Autocomplete
        style={{display:"inline"}}
        disablePortal
        id={op.name.toLowerCase()+"-search"}
        options={op.arr}
        onInputChange={(event, value) => {designedPokemon[op.name.toLowerCase()] = value.toLowerCase()}}
        getOptionLabel={(option) => option.label}
        defaultValue={op.arr[0]}
        renderOption={(props, option) => {
          return (
            <span {...props} style={{}}>
              <Text>{option.label + "  "}</Text>
              <nobr/>
            </span>
          );
        }}
        renderInput={(params) => {
          return (
            <div>
            <StyledTextField
              {...params}
              label={op.name}
              variant="outlined"
              fullWidth
            ></StyledTextField>
            <nobr/>
            
            </div>
          );
        }}
      /><br/></div>
      )}
      </div>
      <Text>BST: {bst}/{MAX_BST} {"("+(MAX_BST-bst)+" Remaining)"}</Text>
      <br/>
      <div style={{display:"grid",gridAutoFlow:"column", width:"100%", rowGap: "10%"}}>
      {statNames.map(sName =>
          <Autocomplete
          style={{display:"inline", gridColumnStart: ((sName == "hp" || sName == "spe") ? 1 : 0)}}
          disablePortal
          id={"type-search-"+sName}
          options={statArr}
          onInputChange={(event, value) => {designedPokemon.stats[sName] = Number(value)}}
          getOptionLabel={(option) => option.label}
          defaultValue={statArr[0]}
          renderOption={(props, option) => {
            return (
              <span {...props} style={{}}>
                <Text style={{ color: statColour[option.value] }}>{option.label}</Text>
                <nobr/>
              </span>
            );
          }}
          renderInput={(params) => {
            return (
              <div>
              <StyledTextField
                {...params}
                fontColor={(statColour[designedPokemon.stats[sName]])}
                label={titleCase(sName)}
                variant="outlined"
                fullWidth
              ></StyledTextField>
              </div>
            );
          }}
        />
      )}
      </div>
      
      
    </div>
    <div className={activatePanel ? '' : 'creation-panel'} style={{opacity:0, pointerEvents:"none", position: "fixed", width: "100%", columnWidth:"100%", height: "5vw", display: "grid", justifySelf: "center", alignSelf: "center", gridAutoFlow: "row", top:"calc(45%)", alignItems:"center", alignContent: "center", justifyContent: "center"}}>
      <div style={{width:"75vw"}}>
      <Item style={{alignSelf:"center", justifySelf:"center", width:"100%"}}>
        <Text>{"Results"}</Text>
      </Item>
      <div style={{display:"grid", gridAutoFlow:"row"}}>
      {pokeCalcs.map(calc => 
         <div className='move-reveal' style={{width: "100%", animationDelay: (1.5 + 0.5*calc.numID).toString() + "s",animationDuration: "0.7s",  display: "grid", gridAutoFlow: "column"}}>
         <Item style={{width:"30vw", height: "50%", justifyContent:"center", alignContent: "center", backgroundColor: (typeColours[calc.move.type.toLowerCase()])}}>
           <Text style={{color: "white", fontSize: "1em", textAlign: "center"}}>{subTitleCase(calc.move.name, "-")}</Text>
         </Item>
          <Text style={{color: (calc.dmg == 0) ? "#009608" : "#FF5349", fontSize: "1em", textAlign: "left"}}>{(calc.dmg == 0 && calc.move.category != "Status") ? "Immune" : (calc.perc + "%")}</Text>
         </div>
      )}
      </div>
    </div></div>
    </div>)
  }
} 

function titleCase(/**@type String */str)
{
    /**@type String */
    var base = str.toLowerCase()
    return base.charAt(0).toUpperCase() + base.slice(1);
}

function splitTitleCase(/**@type String */str)
{
    var parts = str.split("-");
    var final = ""
    for(var i = 0; i < parts.length; i++)
    {
        final += titleCase(parts[i]);
        if(i < parts.length - 1)
        {
            final += " ";
        }
    }
    return final;
}

function subTitleCase(/**@type String */str)
{
    var parts = str.split(/[-\s]/g);
    var final = ""
    var index = 0;
    for(var i = 0; i < parts.length; i++)
    {
        index += parts[i].length;
        final += titleCase(parts[i]);
        if(i < parts.length - 1)
        {
            final += str[index];
            index += 1;
        }
    }
    return final;
}

function arrSum(x)
{
  var sum = 0;
  for(var i = 0; i < x.length; i++)
  {
    sum += Number(x[i]);
  }
  return sum;
}


function App() {
  return (
    <div>
      <PokemonCreator/>
      <MainComp/>
    </div>
  );
}

export default App;
