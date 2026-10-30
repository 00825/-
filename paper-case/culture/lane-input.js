// One physical owner per lane; a second finger must not release the first finger's hold.
export class LaneInput{
 constructor({down,up}){this.down=down;this.up=up;this.owners=new Map();}
 press(owner,lane){if(this.owners.has(owner)||[...this.owners.values()].includes(lane))return false;this.owners.set(owner,lane);this.down(lane);return true;}
 release(owner,cancel=false){if(!this.owners.has(owner))return false;const lane=this.owners.get(owner);this.owners.delete(owner);this.up(lane,cancel);return true;}
 clear(){this.owners.clear();}
}
