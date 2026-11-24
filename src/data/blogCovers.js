/* Cover images for src/data/blog.js — kept apart so blog.js stays importable from Node. */
import munnar from '../assets/Munnar.jpg';
import superGrains from '../assets/bf.webp';
import grainlets from '../assets/cas/banner.webp';
import cookies from '../assets/fav/classic_coclets.webp';
import heritageRice from '../assets/fav/mappillai_samba.webp';
import nammalvar from '../assets/nammalvar.jpg';
import ragiCookie from '../assets/fav/red_millets_mate.webp';

const COVERS = { munnar, superGrains, grainlets, cookies, heritageRice, nammalvar, featureBg: ragiCookie };

export const coverFor = (post) => COVERS[post?.cover] || superGrains;
